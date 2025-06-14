// Em test-consumer/src/app/app.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import type { ConsumeMessage } from 'amqplib';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  // Usamos o OnModuleInit para agendar a configuração
  async onModuleInit() {
    this.logger.log('Hook executado. Agendando setup de consumidor para daqui a 1 segundo...');

    // A SOLUÇÃO PRAGMÁTICA (a mesma da api)
    setTimeout(() => {
      this.logger.log('Timeout finalizado. Configurando consumidor do test-consumer.');
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

      this.logger.log(`Iniciando consumo da fila "${queue}"`);

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
    this.logger.log('🏆🏆🏆 MENSAGEM FINAL RECEBIDA PELA FILA! 🏆🏆🏆');
    this.logger.log(`Conteúdo como string: "${msg.toString()}"`);
  }
}