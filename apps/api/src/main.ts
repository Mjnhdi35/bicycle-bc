import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Validate required environment variables
  const port = configService.get<string>('PORT');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (!port) {
    throw new Error('PORT environment variable is required');
  }
  if (!frontendUrl) {
    throw new Error('FRONTEND_URL environment variable is required');
  }

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(parseInt(port, 10));
  console.log(`🚀 API server running on http://localhost:${port}`);
}
bootstrap();
