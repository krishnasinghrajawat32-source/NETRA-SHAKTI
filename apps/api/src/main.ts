import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { appConfig } from '@netra-shakti/config';

const cookieParser = require('cookie-parser');
const helmet = require('helmet');

async function bootstrap() {
  const logger = new Logger('NETRA_SHAKTI_API');

  const app = await NestFactory.create(AppModule);

  /*
   * -------------------------------------------------------
   * SECURITY HEADERS
   * -------------------------------------------------------
   */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  /*
   * -------------------------------------------------------
   * COOKIE PARSER
   * Required for HttpOnly authentication cookies
   * -------------------------------------------------------
   */
  app.use(cookieParser());

  /*
   * -------------------------------------------------------
   * ALLOWED FRONTEND ORIGINS
   * -------------------------------------------------------
   *
   * Production URL should be configured using:
   *
   * FRONTEND_URL=https://netra-shakti-jy7p.vercel.app
   *
   * or your custom production domain.
   */

  const parseOrigins = (raw?: string): string[] => {
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const staticOrigins = [
    ...parseOrigins(appConfig.APP_URL),
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CORS_ORIGIN),

    // Local frontend
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ].filter((origin): origin is string => Boolean(origin));

  /*
   * -------------------------------------------------------
   * CORS CONFIGURATION
   * -------------------------------------------------------
   */

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      /*
       * Allow requests without browser Origin header.
       * Examples: Postman, curl, server-to-server requests
       */
      if (!origin) {
        return callback(null, true);
      }

      /*
       * If CORS_ORIGIN is wildcard or explicitly allowed
       */
      if (process.env.CORS_ORIGIN === '*' || staticOrigins.includes('*')) {
        return callback(null, true);
      }

      /*
       * Production / environment configured URLs
       */
      const isStaticAllowed = staticOrigins.includes(origin);

      /*
       * NETRA SHAKTI Vercel or Render domain matches
       */
      const isDeployDomain =
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com');

      if (isStaticAllowed || isDeployDomain) {
        return callback(null, true);
      }

      logger.warn(`Blocked CORS origin: ${origin}`);

      return callback(
        new Error('Origin not allowed by CORS policy'),
        false
      );
    },

    /*
     * Required for HttpOnly authentication cookies
     */
    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-Device-Fingerprint'
    ]
  });

  /*
   * -------------------------------------------------------
   * GLOBAL API PREFIX
   * -------------------------------------------------------
   */

  app.setGlobalPrefix('api/v1');

  /*
   * -------------------------------------------------------
   * GLOBAL VALIDATION
   * -------------------------------------------------------
   */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  );

  /*
   * -------------------------------------------------------
   * GLOBAL INTERCEPTORS
   * -------------------------------------------------------
   */

  app.useGlobalInterceptors(
    new TransformInterceptor()
  );

  /*
   * -------------------------------------------------------
   * GLOBAL ERROR HANDLING
   * -------------------------------------------------------
   */

  app.useGlobalFilters(
    new HttpExceptionFilter()
  );

  /*
   * -------------------------------------------------------
   * SERVER PORT
   * -------------------------------------------------------
   */

  const port =
    Number(process.env.PORT) ||
    appConfig.PORT ||
    4000;

  /*
   * -------------------------------------------------------
   * SWAGGER / OPENAPI
   * -------------------------------------------------------
   */

  try {
    const swaggerConfig =
      new DocumentBuilder()
        .setTitle(
          'NETRA SHAKTI // TRACE THE ORIGIN, PROVE THE TRUTH'
        )
        .setDescription(
          'DEFENCE-grade document distribution, post-quantum cryptography, invisible forensic watermarking, and immutable decryption provenance ledger.'
        )
        .setVersion('1.0.0')
        .addBearerAuth()
        .addCookieAuth('ns_access_token')
        .build();

    const document =
      SwaggerModule.createDocument(
        app,
        swaggerConfig
      );

    SwaggerModule.setup(
      'api/docs',
      app,
      document
    );

    logger.log(
      `Swagger OpenAPI Documentation -> http://0.0.0.0:${port}/api/docs`
    );
  } catch (error) {
    logger.warn(
      `Swagger documentation initialized in offline schema mode: ${
        error instanceof Error
          ? error.message
          : 'Unknown error'
      }`
    );
  }

  /*
   * -------------------------------------------------------
   * START SERVER
   * -------------------------------------------------------
   */

  await app.listen(port, '0.0.0.0');

  logger.log(
    `NETRA SHAKTI API running on port ${port} -> http://0.0.0.0:${port}/api/v1`
  );
}

bootstrap().catch((error) => {
  const logger = new Logger(
    'NETRA_SHAKTI_BOOTSTRAP'
  );

  logger.error(
    'Failed to start NETRA SHAKTI API',
    error instanceof Error
      ? error.stack
      : String(error)
  );

  process.exit(1);
});