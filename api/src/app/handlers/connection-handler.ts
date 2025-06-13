// Em api/src/app/handlers/connection-handler.ts

import { Logger } from '@nestjs/common';
import { ConnectionConfig } from '../../schemas/connection-config.schema';
import * as net from 'net';

export class ConnectionHandler {
    private readonly logger: Logger;
    private socket!: net.Socket | net.Server; // <--- CORREÇÃO AQUI

    constructor(private readonly config: ConnectionConfig) {
        this.logger = new Logger(`${ConnectionHandler.name}[${this.config.connectionId}]`);
        this.logger.log('Handler criado. Iniciando lógica de conexão...');

        if (config.connectionType === 'server') {
            this.startServer();
        } else if (config.connectionType === 'client') {
            this.startClient();
        }
    }

    private startServer() {
        this.logger.log(`Iniciando como SERVIDOR na porta ${this.config.port}...`);
        const server = net.createServer((clientSocket) => {
            this.logger.log(`Cliente conectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
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
        this.logger.log(`Iniciando como CLIENTE para <span class="math-inline">\{this\.config\.host\}\:</span>{this.config.port}...`);

        // 1. ADICIONE ESTA VERIFICAÇÃO DE SEGURANÇA AQUI
        if (!this.config.host) {
            this.logger.error(
                `Host não definido para a conexão do tipo cliente: ${this.config.connectionId}`,
            );
            return; // Interrompe a execução se não houver host
        }

        this.socket = new net.Socket();

        // 2. AGORA O TYPESCRIPT SABE QUE this.config.host É UMA STRING
        this.socket.connect(this.config.port, this.config.host, () => {
            this.logger.log('Cliente conectado com sucesso!');
        });

        this.socket.on('close', () => {
            this.logger.warn('Conexão do cliente fechada. Tentando reconectar em 5s...');
        });

        this.socket.on('error', (err) => {
            this.logger.error('Erro no cliente TCP:', err.message);
        });
    }
}