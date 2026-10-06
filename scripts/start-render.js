/**
 * NETRA SHAKTI // Production Startup Script for Render
 * Tagline: TRACE THE ORIGIN, PROVE THE TRUTH
 *
 * Automatically synchronizes PostgreSQL database schema via Prisma,
 * seeds the initial DEFENCE Super Admin credentials,
 * and launches the NestJS Production API Server.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log(' NETRA SHAKTI // DEFENCE CYBERSECURITY & FORENSIC PLATFORM');
console.log(' OFFICIAL TAGLINE: TRACE THE ORIGIN, PROVE THE TRUTH');
console.log('================================================================');

const dbUrl = process.env.DATABASE_URL;

if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
  console.log('[RENDER] PostgreSQL DATABASE_URL detected. Synchronizing database tables...');
  try {
    const schemaPath = path.resolve(__dirname, '../apps/api/prisma/schema.prisma');
    console.log(`[RENDER] Running prisma db push with schema: ${schemaPath}`);
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
      stdio: 'inherit',
      env: process.env
    });
    console.log('[RENDER] Database schema synchronized successfully.');

    console.log('[RENDER] Bootstrapping Super Admin credentials...');
    try {
      execSync('npm run admin:bootstrap', {
        stdio: 'inherit',
        env: process.env
      });
      console.log('[RENDER] Super Admin bootstrapped successfully.');
    } catch (seedErr) {
      console.warn('[RENDER] Super Admin bootstrap returned non-zero (account may already exist):', seedErr.message);
    }
  } catch (dbErr) {
    console.error('[RENDER] Database synchronization error:', dbErr.message);
    console.warn('[RENDER] Continuing application startup (fallback mode enabled)...');
  }
} else {
  console.log('[RENDER] No PostgreSQL DATABASE_URL provided. Running in embedded/air-gapped database mode.');
}

// Locate compiled entrypoint
const candidates = [
  path.resolve(__dirname, '../apps/api/dist/main.js'),
  path.resolve(__dirname, '../apps/api/dist/apps/api/src/main.js')
];

let targetEntry = candidates.find(p => fs.existsSync(p));

if (!targetEntry) {
  console.error('[RENDER] ERROR: Compiled API entry point not found in apps/api/dist!');
  console.error('[RENDER] Please ensure "npm run build:api" ran before starting.');
  process.exit(1);
}

console.log(`[RENDER] Launching NETRA SHAKTI API from: ${targetEntry}`);
require(targetEntry);
