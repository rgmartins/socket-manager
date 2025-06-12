// Em api/src/app/services/connection-manager.service.ts

import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectionConfig } from '../../schemas/connection-config.schema';

@Injectable()
export class ConnectionManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConnectionManagerService.name);

  constructor(
    // 1. Injetamos o "Model" da nossa configuração para falar com o MongoDB
    @InjectModel(ConnectionConfig.name)
    private connectionConfigModel: Model<ConnectionConfig>,
  ) {}

  // 2. Este método será executado automaticamente quando a aplicação iniciar
  async onApplicationBootstrap() {
    this.logger.log('Iniciando o ConnectionManagerService...');

    const activeConnections = await this.connectionConfigModel
      .find({ enabled: true })
      .exec();

    if (activeConnections.length === 0) {
      this.logger.warn('Nenhuma configuração de conexão ativa encontrada no banco de dados.');
      return;
    }

    this.logger.log(`Encontradas ${activeConnections.length} conexões ativas para iniciar.`);

    for (const config of activeConnections) {
      this.logger.log(`Processando configuração para a conexão: ${config.connectionId}`);
      // Futuramente, aqui chamaremos a lógica para iniciar o socket para esta config.
    }
  }
}