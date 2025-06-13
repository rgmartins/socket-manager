// Em api/src/app/services/queue-handler.service.ts

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConnectionManagerService } from './connection-manager.service';
import type { ConsumeMessage } from 'amqplib';

@Injectable()
export class QueueHandlerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QueueHandlerService.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.logger.log('QueueHandlerService inicializado.');
  }

  // Voltamos a usar o OnApplicationBootstrap
  async onApplicationBootstrap() {
    this.logger.log(
      'Hook executado. Agendando setup de consumidores para daqui a 3 segundos...',
    );

    // A abordagem pragmática: esperamos 3 segundos para garantir que tudo do RabbitMQ esteja pronto.
    setTimeout(() => {
      this.logger.log('Timeout finalizado. Executando setup de consumidores.');
      this.setupConsumers();
    }, 3000); // 3000 milissegundos = 3 segundos
  }

  private async setupConsumers() {
    try {
      const channel = this.amqpConnection.channel;
      const exchange = 'socket-exchange';
      const queue = 'socket_manager_send_queue';
      const routingKey = '#.send';

      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      this.logger.log(
        `Iniciando consumo da fila "${queue}" com a rota "${routingKey}"`,
      );

      channel.consume(queue, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleOutgoing(msg);
          channel.ack(msg);
        }
      });
    } catch (err) {
      // O 'any' aqui corrige o segundo erro que você reportou.
      this.logger.error('Falha ao configurar consumidor', err as any);
    }
  }

  public handleOutgoing(amqpMsg: ConsumeMessage) {
    const routingKey = amqpMsg.fields.routingKey;
    this.logger.log(
      `[handleOutgoing] Mensagem recebida com a chave: ${routingKey}`,
    );

    const connectionId = routingKey.replace('.send', '');
    const handler = this.connectionManager.handlers.get(connectionId);

    if (handler) {
      handler.sendMessage(amqpMsg.content);
    } else {
      this.logger.warn(
        `[handleOutgoing] Nenhum handler ativo para a chave: ${routingKey}`,
      );
    }
  }
}