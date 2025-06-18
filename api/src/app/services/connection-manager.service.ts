// Em api/src/app/services/connection-manager.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as net from 'net';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_LOGGER_TOKEN } from '../../../../logger';
import {
  ConnectionConfig,
  ConnectionConfigDocument,
} from '../../schemas/connection-config.schema';

@Injectable()
export class ConnectionManagerService implements OnModuleInit {
  // Inicialize a propriedade 'handlers' diretamente aqui
  private handlers: Map<string, { sendMessage: (data: Buffer) => void }> = new Map();

  constructor(
    @Inject(WINSTON_LOGGER_TOKEN) private readonly logger: WinstonLogger,
    @InjectModel(ConnectionConfig.name)
    private readonly connectionConfigModel: Model<ConnectionConfigDocument>,
    private readonly amqpConnection: AmqpConnection,
  ) { }

  async onModuleInit() {
    this.logger.info(
      'ConnectionManagerService inicializado. A carregar configurações...',
    );
    await this.loadAndInitiateConnections();
  }

  private async loadAndInitiateConnections() {
    try {
      const configs = await this.connectionConfigModel
        .find({ enabled: true })
        .exec();
      this.logger.info(
        `ConnectionManagerService Encontradas ${configs.length} configurações ativas para conectar.`,
      );
      for (const config of configs) {
        this.createConnection(config);
      }
    } catch (error) {
      this.logger.error(
        'ConnectionManagerService Falha ao carregar as configurações de conexão do MongoDB.',
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  private createConnection(config: ConnectionConfigDocument) {
    const { _id, host, port } = config;
    const routing_key = (config as any).routing_key;
    const connectionId = _id.toString();
    this.logger.error(`ConnectionManagerService => host ${config.host} | porta ${config.port} | routing_key ${routing_key}`);

    if (!host || !port || !routing_key) {
      this.logger.error(
        `ConnectionManagerService Configuração de conexão ${connectionId} inválida. Host, porta ou routing_key em falta.`,
        { config: config.toObject() },
      );
      return;
    }

    if (this.handlers.has(connectionId)) {
      this.logger.warn(
        `ConnectionManagerService A conexão para o ID de configuração ${connectionId} já existe.`,
        { host, port },
      );
      return;
    }

    this.logger.info(` ConnectionManagerService A tentar conectar a ${host}:${port}`, { connectionId });
    const client = new net.Socket();

    client.connect(port, host, () => {
      this.logger.info(`ConnectionManagerService Conectado com sucesso a ${host}:${port}`, {
        connectionId,
      });
      this.handlers.set(connectionId, {
        sendMessage: (data: Buffer) => {
          client.write(data);
        },
      });
    });

    client.on('data', (data) => {
      this.logger.debug(`ConnectionManagerService Dados recebidos de ${host}:${port}`, {
        connectionId,
        dataSize: data.length,
      });
      this.publishToQueue(routing_key, data);
    });

    client.on('close', () => {
      this.logger.warn(`ConnectionManagerService Conexão fechada para ${host}:${port}`, { connectionId });
      this.handlers.delete(connectionId);
      setTimeout(() => this.createConnection(config), 5000);
    });

    client.on('error', (error) => {
      this.logger.error(`ConnectionManagerService Erro de conexão para ${host}:${port}`, {
        connectionId,
        errorMessage: error.message,
        stack: error.stack,
      });
    });
  }

  private publishToQueue(routingKey: string, data: Buffer) {
    try {
      this.amqpConnection.publish('ConnectionManagerService socket-exchange', routingKey, data);
      this.logger.info(
        `ConnectionManagerService Mensagem publicada no RabbitMQ com a routing key: ${routingKey}`,
      );
    } catch (error) {
      this.logger.error('ConnectionManagerService Falha ao publicar mensagem no RabbitMQ.', {
        routingKey,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  public getHandlers() {
    return this.handlers;
  }
}