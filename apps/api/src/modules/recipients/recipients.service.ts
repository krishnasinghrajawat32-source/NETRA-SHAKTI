import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger, Inject, Optional } from '@nestjs/common';
import { prisma } from '@netra-shakti/database';
import { AuditService } from '../audit/audit.service';
import { RecipientAccessStatus, DocumentClassification, ClearanceLevel, AuditEventType, UserRole, UserStatus, IUser } from '@netra-shakti/shared-types';

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

export interface AssignRecipientDto {
  recipientId: string;
  expiresAt?: string;
  allowDownload?: boolean;
  allowPrint?: boolean;
  maxAccessCount?: number;
}

@Injectable()
export class RecipientsService {
  private readonly logger = new Logger(RecipientsService.name);
  private _audit: AuditService | null = null;

  constructor(
    @Optional() @Inject(AuditService) private readonly auditService?: AuditService
  ) {}

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) this._audit = new AuditService();
    return this._audit;
  }

  async assignRecipient(
    documentId: string,
    dto: AssignRecipientDto,
    assignedBy: IUser
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { policies: true }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check sender authorization
    if (assignedBy.role !== UserRole.SUPER_ADMIN && assignedBy.role !== UserRole.ADMIN && document.ownerId !== assignedBy.id) {
      throw new ForbiddenException('Only document owner or administrators can assign recipients');
    }

    const recipient = await prisma.user.findUnique({
      where: { id: dto.recipientId }
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    if (recipient.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Cannot assign suspended recipient');
    }

    // Clearance check: Recipient clearance must be >= document classification
    const requiredClearance = classificationToClearance[document.classification as DocumentClassification];
    const recipientClearanceVal = clearanceRank[recipient.clearanceLevel as ClearanceLevel] || 1;
    const requiredClearanceVal = clearanceRank[requiredClearance] || 1;

    if (recipientClearanceVal < requiredClearanceVal) {
      throw new BadRequestException(
        `Recipient clearance level (${recipient.clearanceLevel}) is insufficient for ${document.classification} document (Requires: ${requiredClearance})`
      );
    }

    const assignment = await prisma.documentRecipient.upsert({
      where: {
        documentId_recipientId: {
          documentId,
          recipientId: dto.recipientId
        }
      },
      update: {
        status: RecipientAccessStatus.GRANTED,
        assignedById: assignedBy.id,
        assignedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null
      },
      create: {
        documentId,
        recipientId: dto.recipientId,
        assignedById: assignedBy.id,
        status: RecipientAccessStatus.GRANTED,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        policyId: document.policies?.id || null
      },
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            department: true,
            clearanceLevel: true
          }
        }
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'DISTRIBUTED' }
    });

    await this.audit.log({
      eventType: AuditEventType.RECIPIENT_ASSIGNED,
      userId: assignedBy.id,
      resourceType: 'DOCUMENT_RECIPIENT',
      resourceId: assignment.id,
      action: `Assigned recipient ${recipient.username} (${recipient.clearanceLevel}) to document ${document.documentCode}`,
      status: 'SUCCESS'
    });

    return assignment;
  }

  async listRecipientsForDocument(documentId: string) {
    return prisma.documentRecipient.findMany({
      where: { documentId },
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            department: true,
            rank: true,
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
      },
      orderBy: { assignedAt: 'desc' }
    });
  }

  async revokeRecipient(documentId: string, recipientId: string, actor: IUser) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Document not found');

    if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN && document.ownerId !== actor.id) {
      throw new ForbiddenException('Unauthorized to revoke recipient for this document');
    }

    const updated = await prisma.documentRecipient.update({
      where: {
        documentId_recipientId: {
          documentId,
          recipientId
        }
      },
      data: { status: RecipientAccessStatus.REVOKED }
    });

    await this.audit.log({
      eventType: AuditEventType.RECIPIENT_REVOKED,
      userId: actor.id,
      resourceType: 'DOCUMENT_RECIPIENT',
      resourceId: updated.id,
      action: `Revoked recipient ${recipientId} access to document ${document.documentCode}`,
      status: 'SUCCESS'
    });

    return { message: 'Recipient access successfully revoked' };
  }
}
