import { Module } from '@nestjs/common';
import { ILogger } from './logger.interface';
import { WinstonElkLogger } from './winston-elk.logger';

// Este é o "provider" que faz a ligação.
const loggerProvider = {
  // Dizemos: Para qualquer um que pedir pela dependência com o token 'ILogger'...
  provide: ILogger,
  // ...entregue uma instância da classe 'WinstonElkLogger'.
  // ESTA é a única linha que teria de mudar para usar Datadog, por exemplo.
  useClass: WinstonElkLogger,
};

@Module({
  // Definimos os providers que este módulo oferece.
  providers: [loggerProvider],
  // Exportamos o provider para que outros módulos que importem o LoggerModule o possam usar.
  exports: [loggerProvider],
})
export class LoggerModule {}
