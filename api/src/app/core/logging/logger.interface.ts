// Define uma estrutura para os dados extras que podemos enviar no log
export interface LogData {
  [key: string]: any;
}

// Este é o nosso "contrato". Qualquer logger que criarmos no futuro DEVE ter estes métodos.
export interface ILogger {
  info(message: string, data?: LogData): void;
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
}

// Criamos um "Token de Injeção" para que o NestJS saiba qual dependência injetar
// quando pedirmos por um 'ILogger'. É uma boa prática usar um Symbol para isto.
export const ILogger = Symbol('ILogger');
