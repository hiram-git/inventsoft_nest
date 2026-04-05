import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] !== 'production' }),
  );

  // Global prefix
  const apiPrefix = process.env['API_PREFIX'] ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // URI versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env['WEB_URL'] ?? 'http://localhost:3000',
    credentials: true,
  });

  // Swagger (dev only)
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('InventSoft ERP API')
      .setDescription('ERP system API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
