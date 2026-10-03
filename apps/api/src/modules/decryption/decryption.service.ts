import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger, Inject, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { StorageService } from '../storage/storage.service';
import { WatermarkService } from '../watermark/watermark.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import {
  DecryptionSessionStatus,
  RecipientAccessStatus,
  AuditEventType,
  UserRole,
  IUser,
  IProvenanceRecord
} from '@netra-shakti/shared-types';

export interface DecryptionRequestMeta {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class DecryptionService {
  private readonly logger = new Logger(DecryptionService.name);
  private _storage: StorageService | null = null;
  private _watermark: WatermarkService | null = null;
  private _ledger: LedgerService | null = null;
  private _audit: AuditService | null = null;

  constructor(
    private readonly storageService?: StorageService,
    private readonly watermarkService?: WatermarkService,
    private readonly ledgerService?: LedgerService,
    private readonly auditService?: AuditService
  ) {}

  private get storage(): StorageService {
    if (this.storageService) return this.storageService;
    if (!this._storage) this._storage = new StorageService();
    return this._storage;
  }

  private get watermark(): WatermarkService {
    if (this.watermarkService) return this.watermarkService;
    if (!this._watermark) this._watermark = new WatermarkService();
    return this._watermark;
  }

  private get ledger(): LedgerService {
    if (this.ledgerService) return this.ledgerService;
    if (!this._ledger) this._ledger = new LedgerService();
    return this._ledger;
  }

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) this._audit = new AuditService();
    return this._audit;
  }

  /**
   * Execute full secure decryption, forensic watermarking, signing, and ledger commit workflow
   */
  async startDecryptionWorkflow(
    documentId: string,
    recipient: IUser,
    meta: DecryptionRequestMeta
  ) {
    this.logger.log(`Starting secure decryption workflow for user ${recipient.username} on document ${documentId}`);

    // Step 1: Verify document and authorization
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        policies: true,
        recipients: {
          where: { recipientId: recipient.id }
        }
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Role check: Only assigned recipients (or admins/senders) can decrypt
    const assignment = document.recipients[0];
    if (recipient.role === UserRole.RECIPIENT) {
      if (!assignment || (assignment.status !== RecipientAccessStatus.GRANTED && assignment.status !== RecipientAccessStatus.ACCESSED)) {
        await this.auditService.log({
          eventType: AuditEventType.DECRYPTION_FAILED,
          userId: recipient.id,
          resourceType: 'DOCUMENT',
          resourceId: documentId,
          action: `Unauthorized decryption attempt for document ${document.documentCode}`,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          status: 'FAILURE'
        });
        throw new ForbiddenException('You are not authorized to decrypt this document or access has been revoked');
      }

      // Check expiry
      if (assignment.expiresAt && new Date() > assignment.expiresAt) {
        throw new ForbiddenException('Access to this confidential document has expired');
      }

      // Check max access count
      if (document.policies?.maxAccessCount && assignment.accessCount >= document.policies.maxAccessCount) {
        throw new ForbiddenException(`Maximum access limit (${document.policies.maxAccessCount}) reached`);
      }
    }

    // Step 2: Create Decryption Session in CREATED state
    const sessionCode = `SESS-NS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const sessionNonce = crypto.randomBytes(16).toString('hex');

    const session = await prisma.decryptionSession.create({
      data: {
        sessionCode,
        documentId,
        recipientId: recipient.id,
        status: DecryptionSessionStatus.CREATED,
        startedAt: new Date(),
        ipAddress: meta.ipAddress || null,
        userAgent: meta.userAgent || null,
        deviceFingerprint: meta.deviceFingerprint || null,
        sessionNonce
      }
    });

    try {
      // Step 3: Transition to AUTHORIZING -> DECRYPTING
      await prisma.decryptionSession.update({
        where: { id: session.id },
        data: { status: DecryptionSessionStatus.DECRYPTING }
      });

      // Step 4: Retrieve encrypted blob from storage
      const encryptedBlob = await this.storage.getObject(document.encryptedObjectKey);

      // Step 5: Retrieve wrapped content key & unwrap
      const keyWrapRecord = await prisma.systemConfiguration.findUnique({
        where: { key: `KEY_WRAP_${documentId}` }
      });
      if (!keyWrapRecord) {
        throw new Error('Key wrapping record missing for document');
      }
      const wrappedKey = JSON.parse(keyWrapRecord.value);
      const contentKey = defaultCryptoService.unwrapContentKey(wrappedKey);

      // Step 6: Decrypt document with AES-256-GCM
      const unpacked = defaultCryptoService.unpackEncryptedPayload(encryptedBlob);
      const decryptedPdfBuffer = defaultCryptoService.decryptDocument(
        unpacked.encryptedData,
        contentKey,
        unpacked.iv,
        unpacked.authTag
      );

      // Verify original hash
      const checkOriginalHash = defaultCryptoService.hash(decryptedPdfBuffer);
      if (checkOriginalHash !== document.originalHash) {
        throw new Error('Cryptographic integrity check failed: decrypted content hash mismatch');
      }

      // Step 7: Transition to WATERMARKING
      await prisma.decryptionSession.update({
        where: { id: session.id },
        data: { status: DecryptionSessionStatus.WATERMARKING }
      });

      // Step 8: Generate forensic watermark payload & embed into PDF
      const watermarkPayload = this.watermark.createPayload(
        documentId,
        recipient.id,
        session.id,
        sessionNonce
      );

      const watermarkedPdfBuffer = await this.watermark.embedInPdf(
        decryptedPdfBuffer,
        watermarkPayload
      );

      // Compute final issued document hash
      const issuedDocumentHash = defaultCryptoService.hash(watermarkedPdfBuffer);
      const watermarkHash = defaultCryptoService.hash(JSON.stringify(watermarkPayload));

      // Save Watermark record
      const watermarkRecord = await prisma.watermark.create({
        data: {
          watermarkCode: watermarkPayload.watermarkCode,
          documentId,
          recipientId: recipient.id,
          sessionId: session.id,
          payloadHash: watermarkHash,
          algorithm: 'NETRA-DCT-STEGO-V2',
          version: watermarkPayload.version,
          status: 'ACTIVE'
        }
      });

      // Step 9: Transition to SIGNING
      await prisma.decryptionSession.update({
        where: { id: session.id },
        data: { status: DecryptionSessionStatus.SIGNING }
      });

      // Create Canonical Provenance Record & Digital Signature (Ed25519)
      const provenanceRecord: IProvenanceRecord = {
        version: '1.0.0',
        documentId,
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

      const signatureRecord = await prisma.digitalSignature.create({
        data: {
          sessionId: session.id,
          signerId: recipient.id,
          algorithm: 'Ed25519',
          payloadHash: provenanceHash,
          signature: signatureHex,
          keyVersion: 1,
          verificationStatus: 'VERIFIED'
        }
      });

      // Step 10: Transition to LEDGER_COMMIT
      await prisma.decryptionSession.update({
        where: { id: session.id },
        data: { status: DecryptionSessionStatus.LEDGER_COMMIT }
      });

      const ledgerEvent = await this.ledger.appendEvent({
        eventType: 'DOCUMENT_DECRYPTED_AND_ISSUED',
        entityType: 'DECRYPTION_SESSION',
        entityId: session.id,
        payload: {
          sessionCode: session.sessionCode,
          documentCode: document.documentCode,
          documentId,
          recipientId: recipient.id,
          watermarkCode: watermarkRecord.watermarkCode,
          issuedDocumentHash,
          provenanceHash,
          signature: signatureHex,
          classification: document.classification
        },
        actorId: recipient.id
      });

      // Step 11: Store issued watermarked copy in secure storage
      const issuedStorageKey = `issued-docs/${sessionCode}.pdf`;
      await this.storage.putObject(issuedStorageKey, watermarkedPdfBuffer, 'application/pdf');

      // Step 12: Mark Session COMPLETED
      const completedSession = await prisma.decryptionSession.update({
        where: { id: session.id },
        data: {
          status: DecryptionSessionStatus.COMPLETED,
          completedAt: new Date(),
          issuedObjectKey: issuedStorageKey,
          issuedDocumentHash,
          watermarkId: watermarkRecord.id,
          signatureId: signatureRecord.id,
          ledgerEventId: ledgerEvent.id
        },
        include: {
          document: {
            select: {
              id: true,
              documentCode: true,
              title: true,
              classification: true,
              policies: true
            }
          },
          watermark: true,
          signature: true,
          ledgerEvent: true
        }
      });

      // Increment recipient access count
      if (assignment) {
        await prisma.documentRecipient.update({
          where: { id: assignment.id },
          data: {
            accessCount: { increment: 1 },
            status: RecipientAccessStatus.ACCESSED
          }
        });
      }

      // Audit log
      await this.audit.log({
        eventType: AuditEventType.DECRYPTION_COMPLETED,
        userId: recipient.id,
        resourceType: 'DECRYPTION_SESSION',
        resourceId: session.id,
        action: `Decrypted and issued watermarked document ${document.documentCode} to ${recipient.username}`,
        details: {
          sessionCode,
          watermarkCode: watermarkRecord.watermarkCode,
          ledgerBlock: ledgerEvent.sequenceNumber,
          issuedHash: issuedDocumentHash
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: 'SUCCESS'
      });

      return completedSession;
    } catch (err) {
      this.logger.error(`Decryption workflow failed for session ${session.id}: ${(err as Error).message}`);

      await prisma.decryptionSession.update({
        where: { id: session.id },
        data: {
          status: DecryptionSessionStatus.FAILED,
          errorMessage: (err as Error).message
        }
      });

      await this.audit.log({
        eventType: AuditEventType.DECRYPTION_FAILED,
        userId: recipient.id,
        resourceType: 'DECRYPTION_SESSION',
        resourceId: session.id,
        action: `Decryption workflow error: ${(err as Error).message}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: 'FAILURE'
      });

      throw new BadRequestException(`Decryption workflow failed: ${(err as Error).message}`);
    }
  }

  async getSessionById(sessionId: string, user: IUser) {
    const session = await prisma.decryptionSession.findUnique({
      where: { id: sessionId },
      include: {
        document: {
          include: {
            policies: true,
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            department: true,
            clearanceLevel: true
          }
        },
        watermark: true,
        signature: true,
        ledgerEvent: true
      }
    });

    if (!session) {
      throw new NotFoundException('Decryption session not found');
    }

    // Authorization: Recipient can view own session; Sender/Admin can view
    if (
      user.role === UserRole.RECIPIENT &&
      session.recipientId !== user.id
    ) {
      throw new ForbiddenException('Unauthorized: You cannot inspect another recipient\'s decryption session');
    }

    return session;
  }

  async getIssuedDocumentBuffer(sessionId: string, user: IUser): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const session = await this.getSessionById(sessionId, user);

    if (session.status !== DecryptionSessionStatus.COMPLETED || !session.issuedObjectKey) {
      throw new BadRequestException('Document decryption session has not completed successfully');
    }

    const buffer = await this.storage.getObject(session.issuedObjectKey);
    const filename = `NETRA_ISSUED_${session.document.documentCode}_${session.sessionCode}.pdf`;

    return {
      buffer,
      filename,
      mimeType: 'application/pdf'
    };
  }

  async listSessions(query: {
    documentId?: string;
    recipientId?: string;
    status?: DecryptionSessionStatus;
    page?: number;
    limit?: number;
  }, user: IUser) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.documentId) where.documentId = query.documentId;
    if (query.status) where.status = query.status;

    if (user.role === UserRole.RECIPIENT) {
      where.recipientId = user.id;
    } else if (query.recipientId) {
      where.recipientId = query.recipientId;
    }

    const [sessions, total] = await Promise.all([
      prisma.decryptionSession.findMany({
        where,
        include: {
          document: {
            select: {
              id: true,
              documentCode: true,
              title: true,
              classification: true
            }
          },
          recipient: {
            select: {
              id: true,
              username: true,
              displayName: true,
              department: true
            }
          },
          watermark: {
            select: {
              watermarkCode: true,
              algorithm: true
            }
          },
          ledgerEvent: {
            select: {
              sequenceNumber: true,
              eventHash: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.decryptionSession.count({ where })
    ]);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
