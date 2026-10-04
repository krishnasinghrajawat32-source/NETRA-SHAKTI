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

  // Dynamic CORS for local dev, Vercel preview/production deployments, and configured domains
  const staticOrigins = [
    appConfig.APP_URL,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-side fetch)
      if (!origin) return callback(null, true);

      const isAllowed =
        staticOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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

  const port = appConfig.PORT || 4000;

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
    logger.log(`Swagger OpenAPI Documentation -> http://localhost:${port}/api/docs`);
  } catch (err) {
    logger.warn(`Swagger documentation initialized in offline schema mode: ${(err as Error).message}`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`NETRA SHAKTI API running on port ${port} -> http://localhost:${port}/api/v1`);
  // Ensure event loop stays active indefinitely in background task runners
  setInterval(() => {}, 1000 * 60 * 60);
}

bootstrap();
