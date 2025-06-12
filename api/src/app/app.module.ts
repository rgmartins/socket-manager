// Em api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConnectionManagerService } from './services/connection-manager.service';
import { ConnectionConfig, ConnectionConfigSchema } from '../schemas/connection-config.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://localhost:27017/socket_manager_config',
    ),

    // Registra o nosso "molde" de configuração para ser usado no serviço
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
  controllers: [], // Removemos o AppController
  providers: [ConnectionManagerService], // Adicionamos nosso novo serviço
})
export class AppModule {}