import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_PORT: z.coerce.number().default(3000),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/netra_shakti?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.string().transform(v => v === 'true').default('false'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('netra-shakti-documents'),
  JWT_SECRET: z.string().default('netra-shakti-defense-jwt-access-secret-super-safe-2026'),
  REFRESH_SECRET: z.string().default('netra-shakti-defense-jwt-refresh-secret-super-safe-2026'),
  MASTER_KEY: z.string().default('netra-shakti-defense-grade-master-key-2026-secure'),
  WATERMARK_SECRET: z.string().default('netra-shakti-forensic-watermark-key-2026'),
  CRYPTO_PROVIDER: z.enum(['NATIVE_AES_ED25519', 'PQC_HYBRID_MLKEM']).default('NATIVE_AES_ED25519'),
  LEDGER_PROVIDER: z.enum(['LOCAL_HASH_CHAIN', 'FABRIC_ADAPTER']).default('LOCAL_HASH_CHAIN'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
  MAX_UPLOAD_SIZE: z.coerce.number().default(50 * 1024 * 1024) // 50MB
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function getAppConfig(): AppConfig {
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('Configuration validation warnings (using fallbacks):', result.error.format());
    return ConfigSchema.parse({});
  }
  return result.data;
}

export const appConfig = getAppConfig();
