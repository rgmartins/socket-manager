// Em api/src/app/handlers/connection-handler.ts

import { Logger } from '@nestjs/common';
import { ConnectionConfig } from '../../schemas/connection-config.schema';
import * as net from 'net';

export class ConnectionHandler {
  private readonly logger: Logger;
  private socket!: net.Socket | net.Server;

  constructor(private readonly config: ConnectionConfig) {
    this.logger = new Logger(
      `${ConnectionHandler.name}[${this.config.connectionId}]`,
    );
  }

  public start(): void {
    this.logger.log('Iniciando lógica de conexão...');

    if (this.config.connectionType === 'server') {
      this.startServer();
    } else if (this.config.connectionType === 'client') {
      this.startClient();
    }
  }

  public sendMessage(message: Buffer) {
    this.logger.log(`Tentando enviar dados de ${message.length} bytes.`);

    if (this.socket instanceof net.Socket && this.socket.writable) {
      const lengthHeader = Buffer.alloc(2);
      lengthHeader.writeUInt16BE(message.length);
      const messageToSend = Buffer.concat([lengthHeader, message]);
      this.socket.write(messageToSend);
      this.logger.log(`Mensagem enviada com sucesso.`);
    } else {
      this.logger.warn(
        'Não é possível enviar. O socket não é um cliente ou não está pronto para escrita.',
      );
    }
  }

  private startServer() {
    this.logger.log(`Iniciando como SERVIDOR na porta ${this.config.port}...`);
    const server = net.createServer((clientSocket) => {
      this.logger.log(
        `Cliente conectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`,
      );

      // <<<--- LÓGICA ADICIONADA AQUI ---<<<
      clientSocket.on('data', (data) => {
        // 'data' é um Buffer. .toString() o converte para texto legível.
        this.logger.log(`DADOS RECEBIDOS DO CLIENTE: "${data.toString()}"`);
      });
      // <<<--- FIM DA LÓGICA ADICIONADA ---<<<
    });

    server.on('error', (err) => {
      this.logger.error('Erro no servidor TCP:', err);
    });

    server.listen(this.config.port, this.config.host, () => {
      this.logger.log(`Servidor ouvindo na porta ${this.config.port}`);
    });

    this.socket = server;
  }

  private startClient() {
    this.logger.log(
      `Iniciando como CLIENTE para ${this.config.host}:${this.config.port}...`,
    );
    if (!this.config.host) {
      this.logger.error(
        `Host não definido para a conexão do tipo cliente: ${this.config.connectionId}`,
      );
      return;
    }
    this.socket = new net.Socket();
    this.socket.connect(this.config.port, this.config.host, () => {
      this.logger.log('Cliente conectado com sucesso!');
    });
    this.socket.on('close', () => {
      this.logger.warn(
        'Conexão do cliente fechada. Tentando reconectar em 5s...',
      );
    });
    this.socket.on('error', (err) => {
      this.logger.error('Erro no cliente TCP:', err.message);
    });
  }
}