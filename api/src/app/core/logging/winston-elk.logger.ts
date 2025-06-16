import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { ILogger, LogData } from './logger.interface';

@Injectable()
export class WinstonElkLogger implements ILogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.label({ label: 'socket-manager-api' }),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(), // Manter o formato JSON é crucial
      ),
      transports: [
        // Continuamos a escrever na consola para depuração
        new winston.transports.Console({
           format: winston.format.simple(),
        }),
        // ALTERAÇÃO: Escrevemos os logs num ficheiro em vez de enviar por TCP
        new winston.transports.File({
          filename: 'logs/api.log', // O caminho para o ficheiro de log
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
      exitOnError: false,
    });
  }

  // O resto da classe permanece igual...
  info(message: string, data?: LogData): void {
    this.logger.info(message, data);
  }
  error(message: string, data?: LogData): void {
    this.logger.error(message, data);
  }
  warn(message: string, data?: LogData): void {
    this.logger.warn(message, data);
  }
  debug(message: string, data?: LogData): void {
    this.logger.debug(message, data);
  }
}
