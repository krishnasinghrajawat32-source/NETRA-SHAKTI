import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@netra-shakti/database';
import { AuditEventType, UserRole } from '@netra-shakti/shared-types';

export interface CreateAuditLogParams {
  eventType: AuditEventType;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action: string;
  details?: Record<string, any> | null;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          eventType: params.eventType as any,
          userId: params.userId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          resourceType: params.resourceType || null,
          resourceId: params.resourceId || null,
          action: params.action,
          details: params.details || undefined,
          status: params.status || 'SUCCESS'
        }
      });
      this.logger.log(`[AUDIT] ${params.eventType} - ${params.action} - User: ${params.userId || 'ANONYMOUS'} - Status: ${params.status || 'SUCCESS'}`);
    } catch (err) {
      this.logger.error(`Failed to write audit event: ${(err as Error).message}`);
    }
  }

  async getEvents(query: {
    eventType?: AuditEventType;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.eventType) where.eventType = query.eventType;
    if (query.userId) where.userId = query.userId;

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              role: true,
              clearanceLevel: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditEvent.count({ where })
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
