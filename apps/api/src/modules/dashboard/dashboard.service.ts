import { Injectable, Inject, Optional } from '@nestjs/common';
import { prisma } from '@netra-shakti/database';
import { HealthService } from '../health/health.service';
import { IDashboardStats, UserRole, UserStatus, DecryptionSessionStatus, InvestigationStatus, InvestigationFindingMatch } from '@netra-shakti/shared-types';

@Injectable()
export class DashboardService {
  private _health: HealthService | null = null;

  constructor(
    @Optional() @Inject(HealthService) private readonly healthService?: HealthService
  ) {}

  private get health(): HealthService {
    if (this.healthService) return this.healthService;
    if (!this._health) this._health = new HealthService();
    return this._health;
  }

  async getDashboardStats(): Promise<IDashboardStats> {
    const [
      protectedDocuments,
      activeRecipients,
      completedSessions,
      openInvestigations,
      verifiedAttributionCases,
      failedSecurityOperations,
      recentActivity,
      classificationCounts,
      recentSessions
    ] = await Promise.all([
      prisma.document.count(),
      prisma.user.count({
        where: { role: UserRole.RECIPIENT, status: UserStatus.ACTIVE }
      }),
      prisma.decryptionSession.count({
        where: { status: DecryptionSessionStatus.COMPLETED }
      }),
      prisma.investigation.count({
        where: {
          status: { in: [InvestigationStatus.OPEN, InvestigationStatus.PROCESSING] }
        }
      }),
      prisma.investigationFinding.count({
        where: { matchType: InvestigationFindingMatch.VERIFIED_MATCH }
      }),
      prisma.auditEvent.count({
        where: { status: 'FAILURE' }
      }),
      prisma.auditEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              role: true
            }
          }
        }
      }),
      prisma.document.groupBy({
        by: ['classification'],
        _count: { id: true }
      }),
      prisma.decryptionSession.findMany({
        take: 30,
        orderBy: { startedAt: 'asc' },
        select: { startedAt: true }
      })
    ]);

    // Build classification distribution
    const classificationDistribution = classificationCounts.map(c => ({
      classification: c.classification,
      count: c._count.id
    }));

    // Build timeline aggregated by day
    const sessionMap = new Map<string, number>();
    recentSessions.forEach(s => {
      if (s.startedAt) {
        try {
          const d = new Date(s.startedAt);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().split('T')[0];
            sessionMap.set(dateKey, (sessionMap.get(dateKey) || 0) + 1);
          }
        } catch {}
      }
    });

    const sessionTimeline = Array.from(sessionMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    const health = await this.health.getSystemHealth();

    return {
      protectedDocuments,
      activeRecipients,
      completedSessions,
      openInvestigations,
      verifiedAttributionCases,
      failedSecurityOperations,
      mlServiceStatus: health.services.mlService.status,
      ledgerStatus: health.services.ledgerEngine.status,
      recentActivity: recentActivity as any,
      classificationDistribution,
      sessionTimeline
    };
  }
}
