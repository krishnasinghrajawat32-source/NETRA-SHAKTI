import { Controller, Get, Query, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guards';
import { UserRole, AuditEventType } from '@netra-shakti/shared-types';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-events')
export class AuditController {
  private fallbackService: AuditService | null = null;

  constructor(
    @Optional() @Inject(AuditService) private readonly auditService?: AuditService
  ) {}

  private get service(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this.fallbackService) this.fallbackService = new AuditService();
    return this.fallbackService;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Get security audit logs' })
  async getAuditLogs(
    @Query('eventType') eventType?: AuditEventType,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.getEvents({
      eventType,
      userId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25
    });
  }
}
