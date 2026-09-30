# NETRA SHAKTI
### Cryptographic Attribution and Immutable Decryption Provenance System

> **TRACE THE ORIGIN, PROVE THE TRUTH**

---

## Overview

**NETRA SHAKTI** is a DEFENCE-grade confidential document distribution and forensic leak attribution platform designed for mission-critical, air-gapped security environments.

The platform securely ingests and encrypts confidential documents with **AES-256-GCM**, manages distribution under **Strict Role-Based Access Control (RBAC)** and **Clearance Hierarchies**, embeds **invisible multi-layer forensic watermarks** upon authorized recipient decryption, commits digitally signed provenance proofs to a **tamper-evident hash-chained immutable ledger**, and leverages **Deep Neural AI models (ResNet18 / EfficientNet)** to recover watermarks from degraded or transformed leaks (screenshots, camera scans, re-compressed JPEGs).

---

## Core Technologies

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: NestJS, TypeScript, Swagger/OpenAPI, Passport JWT, HttpOnly Cookie Sessions, Pino Logger.
- **Security & Cryptography**: AES-256-GCM, Ed25519 Digital Signatures, Post-Quantum Cryptography (ML-KEM / ML-DSA), Argon2id, SHA-256, Canonical JSON (RFC 8785).
- **Forensic Watermarking**: Multi-layer invisible Discrete Cosine Transform (DCT) & Spatial Steganography Engine.
- **Provenance Ledger**: Append-only cryptographic hash-chained tamper-evident ledger with full-chain integrity verifier.
- **Database**: PostgreSQL with Prisma ORM.
- **Object Storage**: MinIO (S3-compatible) with automated Air-Gapped Local Secure Vault fallback.
- **ML Forensic Service**: Python 3.11, FastAPI, PyTorch, OpenCV, NumPy, Pillow, scikit-learn.

---

## Monorepo Architecture

```
apps/
  api/          # NestJS Core DEFENCE API Gateway & Security Services
  web/          # Next.js 14 Cyber-DEFENCE Web Application
  ml-service/   # Python FastAPI Machine Learning Forensic Engine

packages/
  shared-types/ # Shared TypeScript Interfaces, Enums & DTOs
  crypto/       # AES-256-GCM, Ed25519, Key Wrapping & PQC Engine
  watermark/    # Invisible Forensic Watermark Engine & PDF Injector
  ledger/       # Tamper-Evident Hash-Chained Immutable Ledger Engine
  database/     # Prisma Schema & PostgreSQL Client Singleton
  config/       # Zod-Validated Environment Configuration

docs/
  ARCHITECTURE.md # Full Architecture Diagrams & Flowcharts
  SECURITY.md     # Threat Model, Cryptographic Specs & Attribution Guidelines

tests/            # Cryptographic, Watermarking, Ledger & Security Test Suites
docker-compose.yml
```

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Generate Database Client & Migrations

```bash
npm run --workspace=packages/database prisma:generate
npm run --workspace=packages/database prisma:push
```

### 4. Bootstrap Initial SUPER_ADMIN

```bash
npm run admin:bootstrap
```

*Default bootstrapped credentials:*
- **Username**: `commander.rawat`
- **Password**: `Admin@Netra2026!`

### 5. (Optional) Seed Test Defense Scenario

```bash
npm run seed:test
```

*Seeded Test Personnel:*
- **SUPER_ADMIN**: `commander.rawat` / `Admin@Netra2026!`
- **SENDER**: `col.sharma` / `Sender@Netra2026!`
- **RECIPIENT**: `maj.verma` / `Recipient@Netra2026!`
- **INVESTIGATOR**: `capt.singh` / `Investigator@Netra2026!`

### 6. Run Full Platform

To run all apps simultaneously:
```bash
npm run dev
```

Or run individual services:
- **API (Port 4000)**: `npm run dev --workspace=apps/api`
- **Web UI (Port 3000)**: `npm run dev --workspace=apps/web`
- **ML Service (Port 8000)**: `cd apps/ml-service && uvicorn main:app --port 8000`

---

## Running with Docker (Air-Gapped Ready)

Run the entire self-contained stack with zero cloud dependencies:

```bash
docker compose up --build -d
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Gateway & Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **ML Forensic Service**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)

---

## Running Automated Test Suites

```bash
npm test
```

Test suites include:
1. **Cryptography Engine**: AES-256-GCM encryption/decryption, ciphertext tampering detection, Ed25519 digital signatures, key wrapping, canonical provenance hashing, and Argon2id verification.
2. **Watermark Engine**: Invisible payload encoding, checksum validation, PDF stream embedding and extraction, and robustness across noise transformations.
3. **Immutable Ledger**: Genesis block creation, sequential hash linking, full chain mathematical proof, and historical tampering detection.

---

## Mandatory Defense Attribution Philosophy

NETRA SHAKTI strictly separates AI detection from cryptographic proof:

1. **AI TO DETECT**: Machine Learning models identify transformation types and extract candidate degraded tokens.
2. **CRYPTOGRAPHY TO VERIFY**: Ed25519 digital signatures and HMAC checksums prove authenticity.
3. **PROVENANCE TO TRACE**: The immutable hash-chained ledger provides incontrovertible proof of decryption events.

All attribution reports include the mandatory defense advisory:

> *"The recovered forensic fingerprint is associated with the recorded decryption session assigned to this recipient. Document attribution identifies the issued source copy and does not independently establish user intent or responsibility for disclosure."*
