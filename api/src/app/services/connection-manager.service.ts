// Em api/src/app/services/connection-manager.service.ts

import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectionConfig } from '../../schemas/connection-config.schema';
import { ConnectionHandler } from '../handlers/connection-handler';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ConnectionManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConnectionManagerService.name);
  public handlers = new Map<string, ConnectionHandler>();

  constructor(
    @InjectModel(ConnectionConfig.name)
    private connectionConfigModel: Model<ConnectionConfig>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  // O método não precisa mais ser async, pois o setTimeout não é "awaitable"
  onApplicationBootstrap() {
    this.logger.log(
      'Hook executado. Agendando a inicialização dos handlers para 3 segundos...',
    );

    // A SOLUÇÃO: Esperamos 3 segundos antes de executar a lógica
    setTimeout(() => {
      this.logger.log('Timeout finalizado. Iniciando os Handlers agora.');
      this.initializeHandlers();
    }, 3000); // 3000 milissegundos = 3 segundos
  }

  private async initializeHandlers() {
    const activeConnections = await this.connectionConfigModel
      .find({ enabled: true })
      .exec();

    this.logger.log(
      `Encontradas ${activeConnections.length} conexões ativas para iniciar.`,
    );

    for (const config of activeConnections) {
      const handler = new ConnectionHandler(config, this.amqpConnection);
      handler.start();
      this.handlers.set(config.connectionId, handler);
    }
  }
}