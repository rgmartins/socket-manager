// Em api/src/app/services/connection-manager.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// Remova a importação de 'net' daqui, pois ConnectionHandler vai lidar com isso
// import * as net from 'net'; // REMOVER ESTA LINHA

import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_LOGGER_TOKEN } from '../../../../logger';
import {
  ConnectionConfig,
  ConnectionConfigDocument,
} from '../../schemas/connection-config.schema';

// Importe a ConnectionHandler
import { ConnectionHandler } from '../handlers/connection-handler';

@Injectable()
export class ConnectionManagerService implements OnModuleInit {
  // Agora os handlers serão instâncias de ConnectionHandler
  private handlers: Map<string, ConnectionHandler> = new Map();

  constructor(
    @Inject(WINSTON_LOGGER_TOKEN) private readonly logger: WinstonLogger,
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
        .find({ enabled: true })
        .exec();
      this.logger.info(
        `ConnectionManagerService Encontradas ${configs.length} configurações ativas para conectar.`,
      );
      for (const config of configs) {
        // Chamaremos a lógica de criação que agora usará ConnectionHandler
        this.createManagedConnection(config);
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

  // Método renomeado para refletir a nova responsabilidade
  private createManagedConnection(config: ConnectionConfigDocument) {
    const { _id, host, port, queueBaseName, connectionType } = config;
    const connectionId = _id.toString();

    this.logger.error(
      `ConnectionManagerService => host ${config.host} | porta ${config.port} | queueBaseName ${queueBaseName} | connectionType ${connectionType}`,
    );

    if (!host || !port || !queueBaseName) {
      this.logger.error(
        `ConnectionManagerService Configuração de conexão ${connectionId} inválida. Host, porta ou queueBaseName em falta.`,
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

    // Criar uma instância de ConnectionHandler
    // Passamos a configuração e a conexão AMQP para ela
    const handler = new ConnectionHandler(config.toObject(), this.amqpConnection); // Usar config.toObject() para garantir que é um objeto simples
    this.handlers.set(connectionId, handler);

    // Iniciar o handler (que decidirá se será cliente ou servidor)
    handler.start();

    // Aqui, precisamos de uma forma de receber dados do ConnectionHandler
    // para publicá-los no RabbitMQ.
    // A ConnectionHandler precisa de um mecanismo para notificar o ConnectionManagerService
    // quando dados são recebidos. Isso pode ser feito via um callback ou EventEmitter.

    // A maneira mais simples é modificar ConnectionHandler para aceitar um callback
    // para dados recebidos ou para publicar diretamente na fila de recebimento
    // (o que já está fazendo na sua implementação atual de ConnectionHandler).

    // Se ConnectionHandler publica diretamente, ConnectionManagerService apenas inicia
    // e gerencia as instâncias. A responsabilidade de 'on data' é do ConnectionHandler.

    this.logger.info(
      `ConnectionManagerService ${connectionType.toUpperCase()} iniciado para ${host}:${port} com ID: ${connectionId}`,
      { connectionId, connectionType },
    );

    // No seu ConnectionHandler, você já tem a lógica de reconexão e tratamento de erros.
    // Se você quiser que o ConnectionManagerService tenha controle sobre isso,
    // ConnectionHandler precisaria emitir eventos ou aceitar callbacks para close/error.
    // Por enquanto, vamos manter a lógica de reconexão dentro do ConnectionHandler
    // para simplificar e seguir o design atual.
  }

  // O método `publishToQueue` permanece igual
  private publishToQueue(routingKey: string, data: Buffer) {
    try {
      this.amqpConnection.publish(
        'socket-exchange',
        routingKey,
        data,
      );
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

  // O método getHandlers agora retornará instâncias de ConnectionHandler
  public getHandlers(): Map<string, ConnectionHandler> {
    return this.handlers;
  }
}