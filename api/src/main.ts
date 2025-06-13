// Em api/src/main.ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  console.log('[DEBUG] Ponto 1: Entrando na função bootstrap...'); // <-- LOG 1

  const app = await NestFactory.create(AppModule);

  console.log('[DEBUG] Ponto 2: NestFactory.create concluiu.'); // <-- LOG 2

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3333;
  await app.listen(port);

  console.log('[DEBUG] Ponto 3: app.listen foi chamado.'); // <-- LOG 3

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );  
}

bootstrap();