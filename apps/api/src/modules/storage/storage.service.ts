import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { appConfig } from '@netra-shakti/config';

let Minio: any = null;
try {
  Minio = require('minio');
} catch {
  // Graceful fallback to air-gapped secure local storage
}

export function resolveCanonicalStorageDir(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, 'apps', 'api'))) {
      const target = path.join(curr, 'data', 'secure-storage');
      if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
      return target;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  const fallback = path.resolve(process.cwd(), 'data', 'secure-storage');
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: any = null;
  private readonly localStorageDir: string;
  private isMinioAvailable = false;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = appConfig.MINIO_BUCKET;
    this.localStorageDir = resolveCanonicalStorageDir();

    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }

    try {
      this.minioClient = new Minio.Client({
        endPoint: appConfig.MINIO_ENDPOINT,
        port: appConfig.MINIO_PORT,
        useSSL: appConfig.MINIO_USE_SSL,
        accessKey: appConfig.MINIO_ACCESS_KEY,
        secretKey: appConfig.MINIO_SECRET_KEY
      });
    } catch (err) {
      this.logger.warn(`MinIO client initialization fallback to local storage: ${(err as Error).message}`);
    }
  }

  async onModuleInit() {
    await this.initStorage();
  }

  private async initStorage() {
    if (this.minioClient) {
      try {
        const exists = await this.minioClient.bucketExists(this.bucketName);
        if (!exists) {
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
          this.logger.log(`Created MinIO bucket: ${this.bucketName}`);
        }
        this.isMinioAvailable = true;
        this.logger.log('MinIO Object Storage connected and operational');
      } catch (err) {
        this.isMinioAvailable = false;
        this.logger.warn(`MinIO unavailable, operating in secure air-gapped local storage mode: ${(err as Error).message}`);
      }
    }
  }

  async putObject(key: string, buffer: Buffer, contentType: string = 'application/octet-stream'): Promise<string> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        await this.minioClient.putObject(this.bucketName, key, buffer, buffer.length, {
          'Content-Type': contentType
        });
        return key;
      } catch (err) {
        this.logger.warn(`MinIO putObject failed, writing to local storage fallback: ${(err as Error).message}`);
      }
    }

    // Local filesystem storage fallback
    const filePath = path.join(this.localStorageDir, key.replace(/[/\\]/g, '_'));
    await fs.promises.writeFile(filePath, buffer);
    return key;
  }

  async getObject(key: string): Promise<Buffer> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const stream = await this.minioClient.getObject(this.bucketName, key);
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', err => reject(err));
        });
      } catch (err) {
        this.logger.warn(`MinIO getObject failed, trying local storage: ${(err as Error).message}`);
      }
    }

    const safeKey = key.replace(/[/\\]/g, '_');
    const primaryPath = path.join(this.localStorageDir, safeKey);
    if (fs.existsSync(primaryPath)) {
      return await fs.promises.readFile(primaryPath);
    }

    const candidates = [
      path.resolve(process.cwd(), 'data', 'secure-storage', safeKey),
      path.resolve(process.cwd(), 'apps', 'api', 'data', 'secure-storage', safeKey),
      path.resolve(process.cwd(), '..', 'data', 'secure-storage', safeKey),
      path.resolve(process.cwd(), '..', 'apps', 'api', 'data', 'secure-storage', safeKey)
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return await fs.promises.readFile(cand);
      }
    }

    throw new Error(`Object key not found in storage: ${key}`);
  }

  async deleteObject(key: string): Promise<void> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        await this.minioClient.removeObject(this.bucketName, key);
      } catch (err) {
        this.logger.warn(`MinIO deleteObject error: ${(err as Error).message}`);
      }
    }

    const filePath = path.join(this.localStorageDir, key.replace(/[/\\]/g, '_'));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async checkHealth(): Promise<{ status: 'UP' | 'DOWN'; latencyMs?: number; details?: string }> {
    const start = Date.now();
    try {
      if (this.isMinioAvailable && this.minioClient) {
        await this.minioClient.bucketExists(this.bucketName);
        return { status: 'UP', latencyMs: Date.now() - start, details: 'MinIO S3 Operational' };
      }
      return { status: 'UP', latencyMs: Date.now() - start, details: 'Air-Gapped Local Storage Operational' };
    } catch (err) {
      return { status: 'DOWN', latencyMs: Date.now() - start, details: (err as Error).message };
    }
  }
}
