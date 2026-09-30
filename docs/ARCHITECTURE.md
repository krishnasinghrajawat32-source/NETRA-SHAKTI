# NETRA SHAKTI // Architecture Blueprint
### Cryptographic Attribution and Immutable Decryption Provenance System

**TRACE THE ORIGIN, PROVE THE TRUTH**

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    User["Client (Browser / DEFENCE Terminal)"]
    Web["apps/web (Next.js 14 App Router)"]
    API["apps/api (NestJS Core API Gateway)"]
    
    subgraph Storage_Layer["Secure Storage Layer"]
        PG[("PostgreSQL\n(Prisma Schema)")]
        Redis[("Redis\n(Locks & State)")]
        MinIO[("MinIO S3 /\nAir-Gapped Vault")]
    end

    subgraph Security_Kernels["Security & Cryptographic Kernels"]
        Crypto["packages/crypto\n(AES-256-GCM + Ed25519)"]
        Watermark["packages/watermark\n(DCT Stego V2)"]
        Ledger["packages/ledger\n(Tamper-Evident Hash Chain)"]
    end

    subgraph ML_Subsystem["Machine Learning Forensics"]
        MLService["apps/ml-service\n(FastAPI + PyTorch/OpenCV)"]
    end

    User <-->|HTTPS / HttpOnly Cookies| Web
    Web <-->|REST /api/v1| API
    API <--> Crypto
    API <--> Watermark
    API <--> Ledger
    API <--> PG
    API <--> Redis
    API <--> MinIO
    API <-->|Private Network| MLService
```

---

## 2. Ingestion & Document Encryption Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Sender as Sender / Admin
    participant API as NestJS API
    participant Crypto as CryptoService
    participant Storage as MinIO / Vault
    participant DB as PostgreSQL
    participant Ledger as LedgerService

    Sender->>API: Upload confidential PDF with classification & policies
    API->>API: Validate Magic Bytes (%PDF-), MIME & size
    API->>Crypto: Generate random 256-bit AES Content Key
    Crypto->>Crypto: Encrypt PDF content (AES-256-GCM + IV + Tag)
    Crypto->>Crypto: Wrap Content Key using Master Key
    API->>Storage: Store packed encrypted blob (enc-docs/...)
    API->>DB: Commit Document & DocumentPolicy records
    API->>Ledger: Append DOCUMENT_ENCRYPTED event block
    API-->>Sender: Return Document details with original/encrypted SHA-256 hashes
```

---

## 3. Secure Decryption & Forensic Issuance State Machine

```mermaid
stateDiagram-v2
    [*] --> CREATED: Recipient Clicks Decrypt
    CREATED --> AUTHORIZING: Verify Clearance & Status
    AUTHORIZING --> DECRYPTING: Unwrap Content Key & Decrypt AES-256
    DECRYPTING --> WATERMARKING: Generate Recipient Token & Embed DCT Stego
    WATERMARKING --> SIGNING: Compute Provenance Hash & Sign with Ed25519
    SIGNING --> LEDGER_COMMIT: Append Hash-Chained Block to Immutable Ledger
    LEDGER_COMMIT --> COMPLETED: Stream Watermarked PDF to Recipient
    
    AUTHORIZING --> FAILED: Access Revoked / Expired / Clearance Violation
    DECRYPTING --> FAILED: Cryptographic Checksum Failure
    WATERMARKING --> FAILED: Steganographic Ingestion Error
```

---

## 4. Hash-Chained Immutable Ledger Block Structure

```mermaid
graph LR
    subgraph Block_1["Block #1 (Genesis)"]
        H1["Event Hash: 8f9b..."]
        P1["Prev Hash: 0000..."]
        S1["Signature: Ed25519"]
    end

    subgraph Block_2["Block #2 (Doc Encrypt)"]
        H2["Event Hash: 4a2e..."]
        P2["Prev Hash: 8f9b..."]
        S2["Signature: Ed25519"]
    end

    subgraph Block_3["Block #3 (Decryption & Issue)"]
        H3["Event Hash: 1c7d..."]
        P3["Prev Hash: 4a2e..."]
        S3["Signature: Ed25519"]
    end

    Block_1 --> Block_2
    Block_2 --> Block_3
```

---

## 5. Digital Forensics & Attribution Pipeline

```mermaid
flowchart TD
    Leak["Investigator Uploads Leaked Evidence (PDF / Screenshot / Photo)"]
    Hash["Compute Evidence SHA-256 Hash"]
    Transform["ML Transformation Classifier (ResNet18)"]
    Pre["Forensic Preprocessing & Image Normalization"]
    WMDetect["Extract Candidate Forensic Token (DCT & Stego Decoders)"]
    CryptoVerify{"Cryptographic Checksum & HMAC Valid?"}
    DBLookup["Map Watermark to Decryption Session in PostgreSQL"]
    SigVerify["Verify Ed25519 Digital Signature"]
    LedgerVerify["Verify Tamper-Evident Hash Chain Proof"]
    Findings["Generate Attributed Finding (VERIFIED_MATCH)"]
    Report["Export Sealed PDF Forensic Attribution Report"]

    Leak --> Hash --> Transform --> Pre --> WMDetect --> CryptoVerify
    CryptoVerify -->|Yes| DBLookup --> SigVerify --> LedgerVerify --> Findings --> Report
    CryptoVerify -->|No| Findings
```
