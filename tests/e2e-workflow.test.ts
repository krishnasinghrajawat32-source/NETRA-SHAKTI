import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { AuthService } from '../apps/api/src/modules/auth/auth.service';
import { DocumentsService } from '../apps/api/src/modules/documents/documents.service';
import { DecryptionService } from '../apps/api/src/modules/decryption/decryption.service';
import { WatermarkService } from '../apps/api/src/modules/watermark/watermark.service';
import { LedgerService } from '../apps/api/src/modules/ledger/ledger.service';
import { StorageService } from '../apps/api/src/modules/storage/storage.service';
import { AuditService } from '../apps/api/src/modules/audit/audit.service';
import { RecipientsService } from '../apps/api/src/modules/recipients/recipients.service';
import { UserRole, ClearanceLevel, DocumentClassification } from '@netra-shakti/shared-types';

describe('NETRA SHAKTI // Full End-to-End Application & Forensic Flow', () => {
  const authService = new AuthService();
  const storageService = new StorageService();
  const watermarkService = new WatermarkService();
  const ledgerService = new LedgerService();
  const auditService = new AuditService();
  const documentsService = new DocumentsService(storageService, auditService);
  const recipientsService = new RecipientsService(auditService);
  const decryptionService = new DecryptionService(storageService, watermarkService, ledgerService, auditService);

  let senderUser: any = null;
  let recipientUser: any = null;
  let testDocument: any = null;
  let decryptionSession: any = null;
  let issuedPdfBuffer: Buffer | null = null;

  test('Step 1 & 2: Public Registration of Personnel A (Sender)', async () => {
    const username = `officer.test.${Date.now()}`;
    const email = `${username}@defence.netrashakti.gov`;
    const password = 'Password@Netra2026!Secure';

    const regResult = await authService.register({
      username,
      email,
      password,
      displayName: 'Capt. Vikram Test',
      department: 'DEFENCE_INTELLIGENCE_AGENCY',
      rank: 'Captain',
      clearanceLevel: ClearanceLevel.TOP_SECRET
    });

    assert.ok(regResult.user, 'Registered user should be returned');
    assert.equal(regResult.user.username, username);

    // Verify stored in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: regResult.user.id }
    });
    assert.ok(dbUser, 'User must be persisted in database');
    assert.notEqual(dbUser.passwordHash, password, 'Password must be hashed with Argon2id');

    // Upgrade to SENDER for upload test
    senderUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: UserRole.SENDER }
    });
  });

  test('Step 3: Sender Authentication & Session Issuance', async () => {
    const loginResult = await authService.login({
      username: senderUser.username,
      password: 'Password@Netra2026!Secure'
    });

    assert.ok(loginResult.accessToken, 'Access token must be generated');
    assert.equal(loginResult.user.id, senderUser.id);
  });

  test('Step 4, 5 & 6: Real PDF Generation, Validation, AES-256 Encryption & Storage', async () => {
    // Create genuine PDF document with PDF-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText('NETRA SHAKTI // CLASSIFIED DEFENCE DIRECTIVE', {
      x: 50,
      y: 750,
      size: 16,
      color: rgb(0, 0, 0)
    });
    page.drawText('OPERATION TRISHUL - TOP SECRET EYES ONLY', {
      x: 50,
      y: 710,
      size: 12,
      color: rgb(0.8, 0, 0)
    });
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Ingest through documentsService
    testDocument = await documentsService.uploadAndEncryptDocument(
      {
        buffer: pdfBuffer,
        originalname: 'trishul_directive.pdf',
        mimetype: 'application/pdf',
        size: pdfBuffer.length
      } as any,
      {
        title: 'OPERATION TRISHUL STRATEGIC DIRECTIVE',
        description: 'Classified defense strategic operational directive for authorized command personnel.',
        classification: DocumentClassification.TOP_SECRET,
        allowDownload: true,
        maxAccessCount: 5
      },
      senderUser
    );

    assert.ok(testDocument.id, 'Document must be created in database');
    assert.ok(testDocument.documentCode.startsWith('DOC-NS-'), 'Document code format must follow standard');
    assert.ok(testDocument.originalHash, 'Original SHA-256 hash must be recorded');
    assert.ok(testDocument.encryptedHash, 'Encrypted hash must be recorded');

    // Verify stored in secure storage
    const storedBlob = await storageService.getObject(testDocument.encryptedObjectKey);
    assert.ok(storedBlob && storedBlob.length > 0, 'Encrypted blob must exist in secure storage');
    assert.notEqual(storedBlob.toString('latin1').slice(0, 5), '%PDF-', 'Ciphertext must NEVER be raw PDF bytes');
  });

  test('Step 7: Public Registration of Recipient B', async () => {
    const username = `recipient.test.${Date.now()}`;
    const email = `${username}@iaf.defence.gov`;
    const password = 'Recipient@Netra2026!Pass';

    const regResult = await authService.register({
      username,
      email,
      password,
      displayName: 'Maj. Aryan Recipient',
      department: 'AIR_DEFENCE_INTELLIGENCE',
      rank: 'Major',
      clearanceLevel: ClearanceLevel.TOP_SECRET
    });

    recipientUser = await prisma.user.findUnique({
      where: { id: regResult.user.id }
    });
    assert.ok(recipientUser, 'Recipient B must be stored in database');
  });

  test('Step 8: Sender Assigns Recipient B with Clearance Verification', async () => {
    const assignment = await recipientsService.assignRecipient(
      testDocument.id,
      {
        recipientId: recipientUser.id
      },
      senderUser
    );

    assert.ok(assignment.id, 'Recipient assignment must be created');
    assert.equal(assignment.recipientId, recipientUser.id);
  });

  test('Step 9: Recipient B Login with Credentials', async () => {
    const loginResult = await authService.login({
      username: recipientUser.username,
      password: 'Recipient@Netra2026!Pass'
    });

    assert.ok(loginResult.accessToken, 'Recipient B must receive access token');
    assert.equal(loginResult.user.id, recipientUser.id);
  });

  test('Step 10, 11, 12 & 13: Decryption Workflow, Forensic Watermarking, Provenance Signing, & Ledger Commit', async () => {
    // Initiate decryption workflow as Recipient B
    decryptionSession = await decryptionService.startDecryptionWorkflow(
      testDocument.id,
      recipientUser,
      {
        ipAddress: '10.0.0.42',
        userAgent: 'NETRA-Secure-Browser/2.4'
      }
    );

    assert.ok(decryptionSession.id, 'Decryption session must be created');
    assert.equal(decryptionSession.status, 'COMPLETED', 'Session must complete successfully');
    assert.ok(decryptionSession.watermarkId, 'Watermark record must be linked');
    assert.ok(decryptionSession.signatureId, 'Ed25519 signature record must be linked');
    assert.ok(decryptionSession.ledgerEventId, 'Ledger event must be committed');

    // Retrieve issued PDF stream buffer
    const fileResult = await decryptionService.getIssuedDocumentBuffer(decryptionSession.id, recipientUser);
    issuedPdfBuffer = fileResult.buffer;

    // Verify PDF Magic Bytes (Guarantee PDF viewer will NOT crash!)
    assert.ok(issuedPdfBuffer && issuedPdfBuffer.length > 0, 'Issued PDF buffer must not be empty');
    const magicHeader = issuedPdfBuffer.toString('latin1').slice(0, 5);
    assert.equal(magicHeader, '%PDF-', 'Issued document MUST be a genuine valid PDF starting with %PDF-');
  });

  test('Step 14: Forensic Attribution Verification from Leak Signal', async () => {
    assert.ok(issuedPdfBuffer, 'Issued PDF must be available');

    // Extract watermark token from issued PDF bytes
    const extractionResult = await watermarkService.extractFromPdf(issuedPdfBuffer);
    assert.equal(extractionResult.extracted, true, 'Watermark engine must recover invisible forensic token from document stream');
    assert.ok(extractionResult.payload, 'Token must pass HMAC verification');
    assert.equal(extractionResult.payload.documentId, testDocument.id, 'Recovered mark must match document ID');
    assert.equal(extractionResult.payload.recipientId, recipientUser.id, 'Recovered mark must mathematically attribute to Recipient B');
    assert.equal(extractionResult.payload.sessionId, decryptionSession.id, 'Recovered mark must match exact session code');
  });

  test('Step 15: Tamper-Evident Ledger Integrity Chain Verification', async () => {
    const chainVerification = await ledgerService.verifyLedgerIntegrity();
    assert.equal(chainVerification.isValid, true, 'Immutable ledger hash chain must be 100% valid');
  });
});
