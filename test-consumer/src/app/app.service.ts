// Em test-consumer/src/app/app.service.ts

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import type { ConsumeMessage } from 'amqplib';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_LOGGER_TOKEN } from '@socket-manager/logger';

@Injectable()
export class AppService implements OnModuleInit {

  constructor(
    @Inject(WINSTON_LOGGER_TOKEN) private readonly logger: WinstonLogger,
    private readonly amqpConnection: AmqpConnection
  ) { }

  // Usamos o OnModuleInit para agendar a configuração
  async onModuleInit() {


    // A SOLUÇÃO PRAGMÁTICA (a mesma da api)
    setTimeout(() => {
      this.logger.info('Timeout finalizado. Configurando consumidor do test-consumer.');
      this.setupConsumer();
    }, 1000); // 1 segundo de espera é mais que suficiente
  }

  // Método privado para conter a lógica de configuração
  private async setupConsumer() {
    try {
      const channel = this.amqpConnection.channel;
      const exchange = 'socket-exchange';
      const queue = 'loopback.server.receive';
      const routingKey = 'loopback.server.receive';

      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);

      this.logger.info(`Iniciando consumo da fila "${queue}"`);

      channel.consume(queue, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleReceivedMessage(msg.content);
          channel.ack(msg);
        }
      });
    } catch (err) {
      this.logger.error('Falha ao configurar consumidor', err as any);
    }
  }

  // O método que de fato processa a mensagem
  public handleReceivedMessage(msg: Buffer) {
    this.logger.info('🏆🏆🏆 MENSAGEM FINAL RECEBIDA PELA FILA! 🏆🏆🏆');
    this.logger.info(`Conteúdo como string: "${msg.toString()}"`);
  }
}