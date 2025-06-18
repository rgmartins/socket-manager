// Em api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConnectionManagerService } from './services/connection-manager.service';
import { ConnectionConfig, ConnectionConfigSchema } from '../schemas/connection-config.schema';
import { QueueHandlerService } from './services/queue-handler.service';
// 1. Importe o nosso módulo a partir do caminho correto
import { LoggerModule } from '../../../logger';

@Module({
  imports: [
    LoggerModule, // 2. Adicione o LoggerModule à lista de imports
    MongooseModule.forRoot(
      'mongodb://localhost:27017/socket_manager_config',
    ),
    MongooseModule.forFeature([
      { name: ConnectionConfig.name, schema: ConnectionConfigSchema },
    ]),
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
  providers: [ConnectionManagerService, QueueHandlerService],
})
export class AppModule {}
