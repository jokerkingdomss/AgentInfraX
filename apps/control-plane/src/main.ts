import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  // Validation is done per-route via ZodValidationPipe.
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`control-plane listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
