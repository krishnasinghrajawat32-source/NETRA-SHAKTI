import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const cookieParser = require('cookie-parser');
const helmet = require('helmet');
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { appConfig } from '@netra-shakti/config';

async function bootstrap() {
  const logger = new Logger('NETRA_SHAKTI_API');
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed per route or client
      crossOriginEmbedderPolicy: false
    })
  );

  // Cookie Parser for HttpOnly Session Management
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Device-Fingerprint']
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  );

  // Global Interceptors and Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT) || appConfig.PORT || 4000;

  // OpenAPI Swagger Documentation
  try {
    const config = new DocumentBuilder()
      .setTitle('NETRA SHAKTI // TRACE THE ORIGIN, PROVE THE TRUTH')
      .setDescription(
        'DEFENCE-grade document distribution, post-quantum cryptography, invisible forensic watermarking, and immutable decryption provenance ledger.'
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addCookieAuth('ns_access_token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger OpenAPI Documentation -> http://0.0.0.0:${port}/api/docs`);
  } catch (err) {
    logger.warn(`Swagger documentation initialized in offline schema mode: ${(err as Error).message}`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`NETRA SHAKTI API running on port ${port} -> http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
