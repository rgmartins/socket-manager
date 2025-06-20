// Em test-consumer/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { LoggerModule } from '@socket-manager/logger'; // <-- 1. IMPORTE AQUI
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AppService } from './app.service';


@Module({
  imports: [
    LoggerModule, // <-- 2. ADICIONE AQUI
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'socket-exchange',
          type: 'topic',
        },
      ],
      uri: 'amqp://user:password@localhost:5672',
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}