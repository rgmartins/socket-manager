// Em logger/src/lib/logger.module.ts
import { Module } from '@nestjs/common';
import { logger as winstonInstance } from './winston.logger.js';

// Este é um "Token" - uma chave única que o NestJS usará para identificar nosso logger.
export const WINSTON_LOGGER_TOKEN = 'WINSTON_LOGGER';

@Module({
  providers: [
    // Aqui estamos dizendo ao NestJS:
    // "Quando algum serviço pedir pela injeção usando a chave 'WINSTON_LOGGER_TOKEN'..."
    {
      provide: WINSTON_LOGGER_TOKEN,
      // "...entregue para ele a nossa instância do logger que está em 'winston.logger.ts'."
      useValue: winstonInstance,
    },
  ],
  // Aqui estamos dizendo: "Permita que outros Módulos que importarem o LoggerModule
  // também tenham acesso a este logger. Isso o torna reutilizável."
  exports: [WINSTON_LOGGER_TOKEN],
})
export class LoggerModule {}