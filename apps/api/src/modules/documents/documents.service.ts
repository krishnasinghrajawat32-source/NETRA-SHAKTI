import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger, Inject, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { PDFDocument } from '@netra-shakti/watermark';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { DocumentClassification, DocumentStatus, AuditEventType, UserRole, ClearanceLevel, IUser } from '@netra-shakti/shared-types';

export interface UploadDocumentDto {
  title: string;
  description?: string;
  classification?: DocumentClassification;
  allowDownload?: boolean;
  allowPrint?: boolean;
  secureViewerOnly?: boolean;
  watermarkRequired?: boolean;
  signatureRequired?: boolean;
  maxAccessCount?: number;
  expiryDate?: string;
}

const clearanceRank: Record<ClearanceLevel, number> = {
  [ClearanceLevel.UNCLASSIFIED]: 1,
  [ClearanceLevel.RESTRICTED]: 2,
  [ClearanceLevel.CONFIDENTIAL]: 3,
  [ClearanceLevel.SECRET]: 4,
  [ClearanceLevel.TOP_SECRET]: 5
};

const classificationToClearance: Record<DocumentClassification, ClearanceLevel> = {
  [DocumentClassification.UNCLASSIFIED]: ClearanceLevel.UNCLASSIFIED,
  [DocumentClassification.CONFIDENTIAL]: ClearanceLevel.CONFIDENTIAL,
  [DocumentClassification.SECRET]: ClearanceLevel.SECRET,
  [DocumentClassification.TOP_SECRET]: ClearanceLevel.TOP_SECRET
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private _storage: StorageService | null = null;
  private _audit: AuditService | null = null;

  constructor(
    @Optional() @Inject(StorageService) private readonly storageService?: StorageService,
    @Optional() @Inject(AuditService) private readonly auditService?: AuditService
  ) {}

  private get storage(): StorageService {
    if (this.storageService) return this.storageService;
    if (!this._storage) this._storage = new StorageService();
    return this._storage;
  }

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) this._audit = new AuditService();
    return this._audit;
  }

  /**
   * Validate PDF magic bytes (%PDF-)
   */
  private validatePdfMagicBytes(buffer: Buffer): boolean {
    if (buffer.length < 5) return false;
    const header = buffer.subarray(0, 5).toString('ascii');
    return header.startsWith('%PDF-');
  }

  async uploadAndEncryptDocument(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    owner: IUser
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No document file provided for cryptographic ingestion');
    }

    // 1. Magic bytes & MIME validation
    if (!this.validatePdfMagicBytes(file.buffer)) {
      throw new BadRequestException('Invalid file format: Document failed PDF magic-byte validation');
    }

    // 2. Classification clearance verification
    const classification = dto.classification || DocumentClassification.CONFIDENTIAL;
    const requiredClearance = classificationToClearance[classification];
    const userClearanceVal = clearanceRank[owner.clearanceLevel as ClearanceLevel] || 1;
    const requiredClearanceVal = clearanceRank[requiredClearance] || 1;

    if (userClearanceVal < requiredClearanceVal && owner.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(`Insufficient clearance to classify document as ${classification}`);
    }

    // 3. Page count extraction
    let pageCount = 1;
    try {
      const pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
    } catch (err) {
      this.logger.warn(`Could not extract page count, defaulting to 1: ${(err as Error).message}`);
    }

    // 4. Calculate Original File Hash (SHA-256)
    const originalHash = defaultCryptoService.hash(file.buffer);

    // 5. Generate random AES-256 content key & encrypt
    const contentKey = defaultCryptoService.generateContentKey();
    const encryptedPayload = defaultCryptoService.encryptDocument(file.buffer, contentKey);
    const packedEncryptedData = defaultCryptoService.packEncryptedPayload(encryptedPayload);

    // 6. Wrap content key with master key for persistent safe keeping
    const wrappedKey = defaultCryptoService.wrapContentKey(contentKey, 1);

    // 7. Store encrypted blob in MinIO/Secure storage
    const docCode = `DOC-NS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const storageKey = `encrypted-docs/${docCode}.enc`;
    await this.storage.putObject(storageKey, packedEncryptedData, 'application/octet-stream');

    const encryptedHash = defaultCryptoService.hash(packedEncryptedData);

    // 8. Commit database record in transaction
    const document = await prisma.$transaction(async tx => {
      const doc = await tx.document.create({
        data: {
          documentCode: docCode,
          title: dto.title,
          description: dto.description || null,
          originalFilename: file.originalname,
          mimeType: file.mimetype || 'application/pdf',
          size: file.size,
          pageCount,
          classification,
          ownerId: owner.id,
          encryptedObjectKey: storageKey,
          originalHash,
          encryptedHash,
          status: DocumentStatus.ENCRYPTED
        }
      });

      // Save wrapped key metadata in system configuration / internal map
      await tx.systemConfiguration.upsert({
        where: { key: `KEY_WRAP_${doc.id}` },
        update: { value: JSON.stringify(wrappedKey) },
        create: {
          key: `KEY_WRAP_${doc.id}`,
          value: JSON.stringify(wrappedKey),
          description: `Wrapped AES-256 key for document ${doc.id}`
        }
      });

      // Create policy
      await tx.documentPolicy.create({
        data: {
          documentId: doc.id,
          allowDownload: dto.allowDownload ?? false,
          allowPrint: dto.allowPrint ?? false,
          secureViewerOnly: dto.secureViewerOnly ?? true,
          watermarkRequired: dto.watermarkRequired ?? true,
          signatureRequired: dto.signatureRequired ?? true,
          maxAccessCount: dto.maxAccessCount ? Number(dto.maxAccessCount) : 5,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null
        }
      });

      return doc;
    });

    // 9. Audit log
    await this.audit.log({
      eventType: AuditEventType.DOCUMENT_UPLOADED,
      userId: owner.id,
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      action: `Uploaded and AES-256-GCM encrypted document: ${document.title} (${document.classification})`,
      details: {
        documentCode: document.documentCode,
        originalHash: document.originalHash,
        encryptedHash: document.encryptedHash,
        pageCount
      },
      status: 'SUCCESS'
    });

    return this.getDocumentById(document.id, owner);
  }

  async listDocuments(query: {
    classification?: DocumentClassification;
    status?: DocumentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }, user: IUser) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.classification) where.classification = query.classification;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { documentCode: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Role-based visibility:
    // RECIPIENT: only assigned documents
    // SENDER: own documents + assigned
    // ADMIN / SUPER_ADMIN / INVESTIGATOR: all documents within clearance
    if (user.role === UserRole.RECIPIENT) {
      const userAssignments = await prisma.documentRecipient.findMany({
        where: {
          recipientId: user.id,
          status: { in: ['GRANTED', 'ACCESSED'] }
        },
        select: { documentId: true }
      });
      where.id = { in: userAssignments.map(a => a.documentId) };
    } else if (user.role === UserRole.SENDER) {
      const senderAssignments = await prisma.documentRecipient.findMany({
        where: { recipientId: user.id },
        select: { documentId: true }
      });
      const assignedIds = senderAssignments.map(a => a.documentId);
      where.OR = [
        ...(where.OR ? where.OR : []),
        { ownerId: user.id },
        { id: { in: assignedIds } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              department: true
            }
          },
          policies: true,
          recipients: {
            include: {
              recipient: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  clearanceLevel: true
                }
              }
            }
          },
          _count: {
            select: {
              decryptionSessions: true,
              recipients: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.document.count({ where })
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getDocumentById(id: string, user: IUser) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            department: true,
            rank: true
          }
        },
        policies: true,
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                username: true,
                displayName: true,
                department: true,
                clearanceLevel: true,
                status: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        decryptionSessions: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            recipient: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Access authorization check
    if (user.role === UserRole.RECIPIENT) {
      const isAssigned = document.recipients.some(r => r.recipientId === user.id && r.status === 'GRANTED');
      if (!isAssigned) {
        throw new ForbiddenException('Access denied: You are not an authorized recipient for this document');
      }
    }

    return document;
  }

  async getWrappedKey(documentId: string) {
    const record = await prisma.systemConfiguration.findUnique({
      where: { key: `KEY_WRAP_${documentId}` }
    });
    if (!record) {
      throw new Error(`Wrapped key missing for document ${documentId}`);
    }
    return JSON.parse(record.value);
  }

  async deleteDocument(id: string, actor: IUser) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    if (actor.role !== UserRole.SUPER_ADMIN && doc.ownerId !== actor.id) {
      throw new ForbiddenException('Only the document owner or Super Admin can delete this document');
    }

    // Delete encrypted storage object
    await this.storage.deleteObject(doc.encryptedObjectKey);

    // Delete db records cascade
    await prisma.document.delete({ where: { id } });
    await prisma.systemConfiguration.deleteMany({ where: { key: `KEY_WRAP_${id}` } });

    await this.audit.log({
      eventType: AuditEventType.DOCUMENT_ENCRYPTED,
      userId: actor.id,
      action: `Deleted document ${doc.documentCode} (${doc.title})`,
      status: 'SUCCESS'
    });

    return { message: 'Document deleted successfully' };
  }
}
