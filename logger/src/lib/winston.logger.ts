// Em logger/src/lib/winston.logger.ts
import * as winston from 'winston';

// Esta é a configuração do nosso logger
export const logger = winston.createLogger({
  // Nível do log. 'info' é um bom padrão.
  // Você pode mudar isso depois usando variáveis de ambiente, se quiser.
  level: 'info',

  // Formato do log. JSON é essencial para o Filebeat/Logstash ler corretamente.
  format: winston.format.combine(
    winston.format.timestamp(), // Adiciona um timestamp a cada log
    winston.format.json()       // Formata a linha inteira de log como um JSON
  ),

  // "Transportes" - ou seja, para onde o log será enviado.
  // Neste caso, apenas para o console (stdout), de onde o Filebeat irá capturá-lo.
  transports: [
    // Vamos manter o console para vermos o log no terminal
    new winston.transports.Console(),

    // E vamos adicionar a escrita em arquivo para o Filebeat
    new winston.transports.File({
      filename: 'logs/api.log', // <-- Nome do arquivo de log
      level: 'info'
    })
  ],
});