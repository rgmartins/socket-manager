// Em api/src/app/services/connection-manager.service.ts
// VERSÃO SIMPLIFICADA
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectionConfig } from '../../schemas/connection-config.schema';
import { ConnectionHandler } from '../handlers/connection-handler';

@Injectable()
export class ConnectionManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConnectionManagerService.name);
  public handlers = new Map<string, ConnectionHandler>(); // Deixamos público para o outro serviço acessar

  constructor(
    @InjectModel(ConnectionConfig.name)
    private connectionConfigModel: Model<ConnectionConfig>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Iniciando o ConnectionManagerService...');
    const activeConnections = await this.connectionConfigModel
      .find({ enabled: true })
      .exec();
    // ...
    this.logger.log(`Encontradas ${activeConnections.length} conexões ativas para iniciar.`);
    for (const config of activeConnections) {
      const handler = new ConnectionHandler(config); // Não precisa mais do amqpConnection
      handler.start();
      this.handlers.set(config.connectionId, handler);
    }
  }
}