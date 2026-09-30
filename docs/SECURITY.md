# NETRA SHAKTI // Security Architecture & Threat Model

## 1. Threat Model & Trust Assumptions

### 1.1 Protected Assets
1. **Confidential Document Content**: Protected in storage via AES-256-GCM envelope encryption.
2. **Provenance & Attribution Records**: Protected by immutable hash-chained blocks and Ed25519 digital signatures.
3. **Personnel Cryptographic Keys**: Stored encrypted with hardware/master key envelope protection.
4. **Audit Logs**: Append-only security events logged for all sensitive operations.

### 1.2 Adversarial Capabilities Addressed
- **Unauthorized Database Tampering**: Any attempt by a rogue administrator or attacker to alter historical records breaks the cryptographic hash-chain link (`previousHash` != `eventHash`), resulting in immediate verification failure in `/ledger/verify`.
- **Credential Sniffing**: Mitigated by HttpOnly cookies, SameSite lax/strict policies, and short-lived 15-minute access tokens with rotating refresh sessions.
- **Leaked Document Denial**: A recipient cannot deny having accessed a document if their unique session nonce, watermark checksum, and digital signature match the ledger record.
- **Degraded Leaks**: Machine learning models and multi-point redundant watermark embedding allow recovery even across JPEG re-compression, rotation, screenshots, and mild crops.

---

## 2. Cryptographic Specifications

- **Symmetric Encryption**: AES-256-GCM with 96-bit random IV and 128-bit authentication tag.
- **Asymmetric Signatures**: Ed25519 defense standard (PureEdDSA over Curve25519).
- **Post-Quantum Cryptography**:
  - Key Encapsulation: NIST FIPS 203 (ML-KEM-768 / CRYSTALS-Kyber).
  - Digital Signatures: NIST FIPS 204 (ML-DSA-65 / CRYSTALS-Dilithium).
- **Hashing**: SHA-256 with deterministic canonical JSON serialization (RFC 8785).
- **Password Hashing**: Argon2id with 64MB memory cost, 3 time cost, 4 parallelism.

---

## 3. Mandatory Forensic Attribution Disclaimer

Under defense protocol, the application adheres to strict, non-accusatory evidentiary language:

> **"The recovered forensic fingerprint is associated with the recorded decryption session assigned to this recipient. Document attribution identifies the issued source copy and does not independently establish user intent or responsibility for disclosure."**
