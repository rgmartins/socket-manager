// Em api/src/app/services/connection-manager.service.ts

import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectionConfig } from '../../schemas/connection-config.schema';
import { ConnectionHandler } from '../handlers/connection-handler';

@Injectable()
export class ConnectionManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private handlers = new Map<string, ConnectionHandler>();

  constructor(
    @InjectModel(ConnectionConfig.name)
    private connectionConfigModel: Model<ConnectionConfig>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Iniciando o ConnectionManagerService...');

    const activeConnections = await this.connectionConfigModel
      .find({ enabled: true })
      .exec();

    if (activeConnections.length === 0) {
      this.logger.warn(
        'Nenhuma configuração de conexão ativa encontrada no banco de dados.',
      );
      return;
    }

    this.logger.log(
      `Encontradas ${activeConnections.length} conexões ativas para iniciar.`,
    );

    for (const config of activeConnections) {
      const handler = new ConnectionHandler(config);
      handler.start();
      this.handlers.set(config.connectionId, handler);
    }

  }
}