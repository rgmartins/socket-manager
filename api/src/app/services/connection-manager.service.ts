import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as net from 'net';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ILogger } from '../core/logging/logger.interface';
import {
  ConnectionConfig,
  ConnectionConfigDocument,
} from '../../schemas/connection-config.schema';

@Injectable()
export class ConnectionManagerService implements OnModuleInit {
  private connections: Map<string, net.Socket> = new Map();

  constructor(
    @Inject(ILogger) private readonly logger: ILogger,
    @InjectModel(ConnectionConfig.name)
    private readonly connectionConfigModel: Model<ConnectionConfigDocument>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async onModuleInit() {
    this.logger.info(
      'ConnectionManagerService inicializado. A carregar configurações...',
    );
    await this.loadAndInitiateConnections();
  }

  private async loadAndInitiateConnections() {
    try {
      const configs = await this.connectionConfigModel
        .find({ is_active: true })
        .exec();
      this.logger.info(
        `Encontradas ${configs.length} configurações ativas para conectar.`,
      );
      for (const config of configs) {
        this.createConnection(config);
      }
    } catch (error) {
      this.logger.error(
        'Falha ao carregar as configurações de conexão do MongoDB.',
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  private createConnection(config: ConnectionConfigDocument) {
    // Destrutura as propriedades que o TypeScript já conhece
    const { _id, host, port } = config;
    // NOTA: Acessamos `routing_key` desta forma para evitar um erro de compilação.
    // A solução ideal a longo prazo é garantir que a propriedade `routing_key`
    // está corretamente definida com o decorador `@Prop()` no seu ficheiro
    // `connection-config.schema.ts`.
    const routing_key = (config as any).routing_key;
    const connectionId = _id.toString();

    // Verificação de segurança para garantir que os dados essenciais existem
    if (!host || !port || !routing_key) {
      this.logger.error(
        `Configuração de conexão ${connectionId} inválida. Host, porta ou routing_key em falta.`,
        { config: config.toObject() },
      );
      return;
    }

    if (this.connections.has(connectionId)) {
      this.logger.warn(
        `A conexão para o ID de configuração ${connectionId} já existe.`,
        { host, port },
      );
      return;
    }

    this.logger.info(`A tentar conectar a ${host}:${port}`, { connectionId });
    const client = new net.Socket();

    client.connect(port, host, () => {
      this.logger.info(`Conectado com sucesso a ${host}:${port}`, {
        connectionId,
      });
      this.connections.set(connectionId, client);
    });

    client.on('data', (data) => {
      this.logger.debug(`Dados recebidos de ${host}:${port}`, {
        connectionId,
        dataSize: data.length,
      });
      this.publishToQueue(routing_key, data);
    });

    client.on('close', () => {
      this.logger.warn(`Conexão fechada para ${host}:${port}`, { connectionId });
      this.connections.delete(connectionId);
      setTimeout(() => this.createConnection(config), 5000);
    });

    client.on('error', (error) => {
      this.logger.error(`Erro de conexão para ${host}:${port}`, {
        connectionId,
        errorMessage: error.message,
        stack: error.stack,
      });
    });
  }

  private publishToQueue(routingKey: string, data: Buffer) {
    try {
      this.amqpConnection.publish('socket-exchange', routingKey, data);
      this.logger.info(
        `Mensagem publicada no RabbitMQ com a routing key: ${routingKey}`,
      );
    } catch (error) {
      this.logger.error('Falha ao publicar mensagem no RabbitMQ.', {
        routingKey,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
