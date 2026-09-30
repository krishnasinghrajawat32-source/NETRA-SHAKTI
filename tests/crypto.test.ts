import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultCryptoService } from '../packages/crypto/src';
import { IProvenanceRecord } from '../packages/shared-types/src';

describe('NETRA SHAKTI // Cryptographic Engine Tests', () => {
  const cryptoService = defaultCryptoService;

  test('AES-256-GCM: encrypts and decrypts binary payload correctly with auth tag integrity', () => {
    const rawData = Buffer.from('CONFIDENTIAL MILITARY DIRECTIVE // OPERATION TRISHUL', 'utf8');
    const contentKey = cryptoService.generateContentKey();

    assert.equal(contentKey.length, 32);

    const encrypted = cryptoService.encryptDocument(rawData, contentKey);
    assert.ok(encrypted.encryptedData.length > 0);
    assert.equal(encrypted.iv.length, 12);
    assert.equal(encrypted.authTag.length, 16);

    const decrypted = cryptoService.decryptDocument(
      encrypted.encryptedData,
      contentKey,
      encrypted.iv,
      encrypted.authTag
    );

    assert.equal(decrypted.toString('utf8'), rawData.toString('utf8'));
  });

  test('AES-256-GCM: detects tampering in ciphertext and throws authentication error', () => {
    const rawData = Buffer.from('TOP SECRET TARGET COORDINATES', 'utf8');
    const contentKey = cryptoService.generateContentKey();
    const encrypted = cryptoService.encryptDocument(rawData, contentKey);

    const tamperedData = Buffer.from(encrypted.encryptedData);
    tamperedData[0] ^= 0xff;

    assert.throws(() => {
      cryptoService.decryptDocument(
        tamperedData,
        contentKey,
        encrypted.iv,
        encrypted.authTag
      );
    });
  });

  test('Ed25519: generates asymmetric keypair, signs and verifies signature', () => {
    const keyPair = cryptoService.generateSigningKeyPair();
    assert.match(keyPair.publicKey, /BEGIN PUBLIC KEY/);
    assert.match(keyPair.privateKey, /BEGIN PRIVATE KEY/);

    const message = 'LEDGER_EVENT_BLOCK_HASH_8F9D2A1C';
    const signature = cryptoService.signPayload(message, keyPair.privateKey);

    const isValid = cryptoService.verifySignature(message, signature, keyPair.publicKey);
    assert.equal(isValid, true);

    const isInvalid = cryptoService.verifySignature('ALTERED_MESSAGE', signature, keyPair.publicKey);
    assert.equal(isInvalid, false);
  });

  test('Key Wrapping: wraps and unwraps content key with Master Key', () => {
    const contentKey = cryptoService.generateContentKey();
    const wrapped = cryptoService.wrapContentKey(contentKey, 1);

    assert.ok(wrapped.wrappedKey !== undefined);
    assert.ok(wrapped.iv !== undefined);
    assert.ok(wrapped.authTag !== undefined);

    const unwrapped = cryptoService.unwrapContentKey(wrapped);
    assert.ok(unwrapped.equals(contentKey));
  });

  test('Canonical Provenance Hashing: produces deterministic SHA-256 hash', () => {
    const record1: IProvenanceRecord = {
      version: '1.0.0',
      documentId: 'DOC-123',
      documentHash: 'abc',
      recipientId: 'USER-456',
      sessionId: 'SESS-789',
      watermarkHash: 'wm-hash',
      keyVersion: 1,
      timestamp: 1711000000000,
      eventNonce: 'nonce-123'
    };

    const record2: IProvenanceRecord = {
      ...record1
    };

    const hash1 = cryptoService.hashProvenanceRecord(record1);
    const hash2 = cryptoService.hashProvenanceRecord(record2);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  test('Password Hashing: hashes and verifies password correctly', async () => {
    const password = 'Defense@Secret2026!';
    const hash = await cryptoService.hashPassword(password);

    const isMatch = await cryptoService.verifyPassword(password, hash);
    assert.equal(isMatch, true);

    const isWrong = await cryptoService.verifyPassword('WrongPassword!', hash);
    assert.equal(isWrong, false);
  });
});
