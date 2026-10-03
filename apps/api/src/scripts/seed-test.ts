import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { defaultWatermarkService, PDFDocument, rgb, StandardFonts } from '@netra-shakti/watermark';
import { defaultLedgerService } from '@netra-shakti/ledger';
import * as fs from 'fs';
import * as path from 'path';
import {
  UserRole,
  ClearanceLevel,
  UserStatus,
  DocumentClassification,
  DocumentStatus,
  RecipientAccessStatus,
  DecryptionSessionStatus,
  InvestigationStatus,
  InvestigationFindingMatch,
  TransformationType,
  IProvenanceRecord
} from '@netra-shakti/shared-types';

async function generateSamplePdf(title: string, classification: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 40,
    y: 770,
    width: 515.28,
    height: 30,
    color: rgb(0.04, 0.1, 0.18)
  });

  page.drawText(`CLASSIFIED // ${classification}`, {
    x: 50,
    y: 780,
    size: 14,
    font,
    color: rgb(0.0, 0.94, 1.0)
  });

  page.drawText(title, {
    x: 50,
    y: 720,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1)
  });

  page.drawText('OPERATION NETRA SHAKTI: STRATEGIC CYBER DEFENSE INITIATIVE', {
    x: 50,
    y: 690,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3)
  });

  const bodyText = `
1. PURPOSE & SCOPE
This confidential directive specifies operational cryptographic attribution protocols for defense document distribution. All recipients accessing this document are bound by the Official Secrets Act and Military Cryptographic Directive 2026.

2. FORENSIC WATERMARK NOTICE
Every decryption session of this document is dynamically bound to recipient identity, cryptographic hardware nonces, and timestamped in an immutable hash-chained ledger. Any unauthorized reproduction, screenshot, or disclosure will be forensically attributed to the issuing session.

3. STRATEGIC TARGET SUMMARY
Critical defense assets are protected under quantum-resistant encryption (ML-KEM/ML-DSA) and distributed forensic watermarking nodes.
  `;

  page.drawText(bodyText, {
    x: 50,
    y: 640,
    size: 10,
    font: regularFont,
    color: rgb(0.15, 0.15, 0.15),
    lineHeight: 16
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function seedTest() {
  console.log('=== NETRA SHAKTI // EXPLICIT TEST SEED EXECUTION ===');

  function writeToStorage(relKey: string, data: Buffer) {
    const safeKey = relKey.replace(/[/\\]/g, '_');
    const dirs = [
      path.resolve(process.cwd(), 'data', 'secure-storage'),
      path.resolve(process.cwd(), 'apps', 'api', 'data', 'secure-storage'),
      path.resolve(process.cwd(), '..', 'data', 'secure-storage'),
      path.resolve(process.cwd(), '..', 'apps', 'api', 'data', 'secure-storage')
    ];
    for (const d of dirs) {
      try {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, safeKey), data);
      } catch {}
    }
  }

  // 1. Create Super Admin
  const adminPass = await defaultCryptoService.hashPassword('Netra@Shakti2026!Defence');
  const admin = await prisma.user.upsert({
    where: { username: 'netra.admin' },
    update: {},
    create: {
      username: 'netra.admin',
      email: 'admin@defence.netrashakti.gov',
      displayName: 'National Cyber Security Director',
      passwordHash: adminPass,
      role: UserRole.SUPER_ADMIN,
      department: 'DEFENCE_CYBER_COMMAND',
      rank: 'Director General',
      unit: 'HQ Strategic Cyber Command',
      clearanceLevel: ClearanceLevel.TOP_SECRET,
      status: UserStatus.ACTIVE
    }
  });

  // 2. Create Sender
  const senderPass = await defaultCryptoService.hashPassword('Sender@Netra2026!');
  const sender = await prisma.user.upsert({
    where: { username: 'sender.officer' },
    update: {},
    create: {
      username: 'sender.officer',
      email: 'sender@defence.netrashakti.gov',
      displayName: 'Defence Intelligence Operations Officer',
      passwordHash: senderPass,
      role: UserRole.SENDER,
      department: 'DEFENCE_INTELLIGENCE_AGENCY',
      rank: 'Colonel',
      unit: 'Special Operations Directorate',
      clearanceLevel: ClearanceLevel.TOP_SECRET,
      status: UserStatus.ACTIVE
    }
  });

  // 3. Create Recipient
  const recipientPass = await defaultCryptoService.hashPassword('Recipient@Netra2026!');
  const recipient = await prisma.user.upsert({
    where: { username: 'recipient.officer' },
    update: {},
    create: {
      username: 'recipient.officer',
      email: 'recipient@defence.netrashakti.gov',
      displayName: 'Authorized Field Recipient Officer',
      passwordHash: recipientPass,
      role: UserRole.RECIPIENT,
      department: 'AIR_DEFENCE_INTELLIGENCE',
      rank: 'Major',
      unit: 'Electronic Warfare Wing',
      clearanceLevel: ClearanceLevel.SECRET,
      status: UserStatus.ACTIVE
    }
  });

  // 4. Create Investigator
  const investigatorPass = await defaultCryptoService.hashPassword('Investigator@Netra2026!');
  const investigator = await prisma.user.upsert({
    where: { username: 'investigator.officer' },
    update: {},
    create: {
      username: 'investigator.officer',
      email: 'investigator@defence.netrashakti.gov',
      displayName: 'Digital Forensics Principal Investigator',
      passwordHash: investigatorPass,
      role: UserRole.INVESTIGATOR,
      department: 'CYBER_FORENSIC_DIRECTORATE',
      rank: 'Captain',
      unit: 'Digital Evidence Unit',
      clearanceLevel: ClearanceLevel.TOP_SECRET,
      status: UserStatus.ACTIVE
    }
  });

  console.log('[+] Users created successfully');

  // 5. Create Sample Document
  const docPdfBuffer = await generateSamplePdf(
    'Operation Trishul: Strategic Air Defense Protocol',
    'SECRET'
  );
  const originalHash = defaultCryptoService.hash(docPdfBuffer);

  const contentKey = defaultCryptoService.generateContentKey();
  const encryptedPayload = defaultCryptoService.encryptDocument(docPdfBuffer, contentKey);
  const packedEncrypted = defaultCryptoService.packEncryptedPayload(encryptedPayload);
  const wrappedKey = defaultCryptoService.wrapContentKey(contentKey, 1);

  const docCode = 'DOC-NS-TRISHUL-2026';
  const storageKey = `encrypted-docs/${docCode}.enc`;
  writeToStorage(storageKey, packedEncrypted);

  const document = await prisma.document.upsert({
    where: { documentCode: docCode },
    update: {
      originalHash,
      encryptedHash: defaultCryptoService.hash(packedEncrypted),
      encryptedObjectKey: storageKey,
      size: docPdfBuffer.length
    },
    create: {
      documentCode: docCode,
      title: 'Operation Trishul: Strategic Air Defense Protocol',
      description: 'Comprehensive operational guidelines for electronic countermeasures and radar network sync.',
      originalFilename: 'Operation_Trishul_Protocol.pdf',
      mimeType: 'application/pdf',
      size: docPdfBuffer.length,
      pageCount: 1,
      classification: DocumentClassification.SECRET,
      ownerId: sender.id,
      encryptedObjectKey: storageKey,
      originalHash,
      encryptedHash: defaultCryptoService.hash(packedEncrypted),
      status: DocumentStatus.DISTRIBUTED
    }
  });

  await prisma.systemConfiguration.upsert({
    where: { key: `KEY_WRAP_${document.id}` },
    update: { value: JSON.stringify(wrappedKey) },
    create: {
      key: `KEY_WRAP_${document.id}`,
      value: JSON.stringify(wrappedKey),
      description: `Wrapped AES-256 key for document ${document.id}`
    }
  });

  const policy = await prisma.documentPolicy.upsert({
    where: { documentId: document.id },
    update: {},
    create: {
      documentId: document.id,
      allowDownload: true,
      allowPrint: false,
      secureViewerOnly: true,
      watermarkRequired: true,
      signatureRequired: true,
      maxAccessCount: 10
    }
  });

  // Assign Recipient
  const recipientAssignment = await prisma.documentRecipient.upsert({
    where: {
      documentId_recipientId: {
        documentId: document.id,
        recipientId: recipient.id
      }
    },
    update: {
      status: RecipientAccessStatus.GRANTED,
      policyId: policy.id
    },
    create: {
      documentId: document.id,
      recipientId: recipient.id,
      assignedById: sender.id,
      policyId: policy.id,
      status: RecipientAccessStatus.GRANTED
    }
  });

  console.log('[+] Document and Recipient Assignment seeded');

  // 6. Create Decryption Session with Real Watermark, Signature & Ledger Block
  const sessionCode = 'SESS-NS-DEMO-2026-01';
  const sessionNonce = defaultCryptoService.hash('test-session-nonce-demo');

  const watermarkPayload = defaultWatermarkService.createPayload(
    document.id,
    recipient.id,
    'temp-sess-id',
    sessionNonce
  );

  const watermarkedPdf = await defaultWatermarkService.embedInPdf(docPdfBuffer, watermarkPayload);
  const issuedHash = defaultCryptoService.hash(watermarkedPdf);
  const watermarkHash = defaultCryptoService.hash(JSON.stringify(watermarkPayload));

  const issuedStorageKey = `issued-docs/${sessionCode}.pdf`;
  writeToStorage(issuedStorageKey, watermarkedPdf);

  const session = await prisma.decryptionSession.upsert({
    where: { sessionCode },
    update: {
      documentId: document.id,
      recipientId: recipient.id,
      status: DecryptionSessionStatus.COMPLETED,
      sessionNonce,
      issuedObjectKey: issuedStorageKey,
      issuedDocumentHash: issuedHash
    },
    create: {
      sessionCode,
      documentId: document.id,
      recipientId: recipient.id,
      status: DecryptionSessionStatus.COMPLETED,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      sessionNonce,
      issuedObjectKey: issuedStorageKey,
      issuedDocumentHash: issuedHash,
      ipAddress: '10.240.12.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NetraSecureBrowser/1.0',
      deviceFingerprint: 'FP-MIL-STD-810G-09A4'
    }
  });

  const watermark = await prisma.watermark.upsert({
    where: { watermarkCode: watermarkPayload.watermarkCode },
    update: { sessionId: session.id },
    create: {
      watermarkCode: watermarkPayload.watermarkCode,
      documentId: document.id,
      recipientId: recipient.id,
      sessionId: session.id,
      payloadHash: watermarkHash,
      algorithm: 'NETRA-DCT-STEGO-V2',
      version: '2.4.0',
      status: 'ACTIVE'
    }
  });

  const provenanceRecord: IProvenanceRecord = {
    version: '1.0.0',
    documentId: document.id,
    documentHash: document.originalHash,
    recipientId: recipient.id,
    sessionId: session.id,
    watermarkHash,
    keyVersion: 1,
    timestamp: Date.now(),
    eventNonce: sessionNonce
  };

  const provenanceHash = defaultCryptoService.hashProvenanceRecord(provenanceRecord);
  const systemSigningKey = defaultCryptoService.getSystemSigningKeyPair();
  const signatureHex = defaultCryptoService.signPayload(provenanceHash, systemSigningKey.privateKey);

  const signature = await prisma.digitalSignature.upsert({
    where: { sessionId: session.id },
    update: {
      signature: signatureHex,
      payloadHash: provenanceHash,
      verificationStatus: 'VERIFIED'
    },
    create: {
      sessionId: session.id,
      signerId: recipient.id,
      algorithm: 'Ed25519',
      payloadHash: provenanceHash,
      signature: signatureHex,
      keyVersion: 1,
      verificationStatus: 'VERIFIED'
    }
  });

  // Genesis + Decryption Ledger Events
  let prevEvent = await prisma.ledgerEvent.findFirst({ orderBy: { sequenceNumber: 'desc' } });
  if (!prevEvent) {
    const genesisBlock = defaultLedgerService.createEventBlock({
      eventType: 'LEDGER_GENESIS_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'NETRA-SHAKTI-ROOT',
      payload: { system: 'NETRA SHAKTI', airGapped: true, pqcReady: true },
      actorId: admin.id
    });

    prevEvent = (await prisma.ledgerEvent.create({
      data: {
        sequenceNumber: genesisBlock.sequenceNumber,
        eventType: genesisBlock.eventType,
        entityType: genesisBlock.entityType,
        entityId: genesisBlock.entityId,
        payloadHash: genesisBlock.payloadHash,
        previousHash: genesisBlock.previousHash,
        eventHash: genesisBlock.eventHash,
        signature: genesisBlock.signature,
        actorId: genesisBlock.actorId,
        createdAt: new Date(genesisBlock.createdAt)
      }
    })) as any;
  }

  const decBlock = defaultLedgerService.createEventBlock(
    {
      eventType: 'DOCUMENT_DECRYPTED_AND_ISSUED',
      entityType: 'DECRYPTION_SESSION',
      entityId: session.id,
      payload: {
        sessionCode,
        documentCode: docCode,
        recipientId: recipient.id,
        watermarkCode: watermark.watermarkCode,
        issuedDocumentHash: issuedHash
      },
      actorId: recipient.id
    },
    prevEvent as any
  );

  const ledgerEvent = await prisma.ledgerEvent.create({
    data: {
      sequenceNumber: decBlock.sequenceNumber,
      eventType: decBlock.eventType,
      entityType: decBlock.entityType,
      entityId: decBlock.entityId,
      payloadHash: decBlock.payloadHash,
      previousHash: decBlock.previousHash,
      eventHash: decBlock.eventHash,
      signature: decBlock.signature,
      actorId: decBlock.actorId,
      createdAt: new Date(decBlock.createdAt)
    }
  });

  await prisma.decryptionSession.update({
    where: { id: session.id },
    data: {
      watermarkId: watermark.id,
      signatureId: signature.id,
      ledgerEventId: ledgerEvent.id
    }
  });

  console.log('[+] Decryption session, watermark, digital signature & ledger block #2 committed');

  // 7. Seed ML Model registry
  await prisma.mLModel.upsert({
    where: { id: 'model-resnet18-watermark-v2' },
    update: {},
    create: {
      id: 'model-resnet18-watermark-v2',
      name: 'ResNet18-ForensicWatermarkNet',
      version: '2.4.0',
      task: 'WATERMARK_RECOVERY',
      framework: 'PyTorch + ONNX',
      artifactPath: 'models/forensic_resnet18_v2.onnx',
      datasetVersion: 'DEFENSE-SYNTH-V3',
      accuracy: 0.987,
      precision: 0.991,
      recall: 0.984,
      f1Score: 0.9875,
      watermarkRecoveryRate: 0.965,
      status: 'ACTIVE'
    }
  });

  console.log('====================================================');
  console.log('TEST SEED COMPLETED SUCCESSFULLY!');
  console.log('Credentials:');
  console.log('  SUPER ADMIN:   netra.admin          / Netra@Shakti2026!Defence');
  console.log('  SENDER:        sender.officer       / Sender@Netra2026!');
  console.log('  RECIPIENT:     recipient.officer    / Recipient@Netra2026!');
  console.log('  INVESTIGATOR:  investigator.officer / Investigator@Netra2026!');
  console.log('====================================================');
}

seedTest()
  .catch(err => {
    console.error('Test seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
