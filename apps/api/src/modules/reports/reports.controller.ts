import { Controller, Get, Param, Res, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { InvestigationsService } from '../investigations/investigations.service';
import { AuditService } from '../audit/audit.service';
import { WatermarkService } from '../watermark/watermark.service';
import { MLService } from '../ml/ml.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guards';
import { UserRole, IUser } from '@netra-shakti/shared-types';

@ApiTags('Forensic Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investigations/:id/report')
export class ReportsController {
  private fallbackReportsService: ReportsService | null = null;
  private fallbackInvestigationsService: InvestigationsService | null = null;

  constructor(
    @Optional() @Inject(ReportsService) private readonly reportsService?: ReportsService,
    @Optional() @Inject(InvestigationsService) private readonly investigationsService?: InvestigationsService
  ) {}

  private get repService(): ReportsService {
    if (this.reportsService) return this.reportsService;
    if (!this.fallbackReportsService) {
      this.fallbackReportsService = new ReportsService(new AuditService());
    }
    return this.fallbackReportsService;
  }

  private get invService(): InvestigationsService {
    if (this.investigationsService) return this.investigationsService;
    if (!this.fallbackInvestigationsService) {
      this.fallbackInvestigationsService = new InvestigationsService(
        new WatermarkService(),
        new MLService(),
        new AuditService(),
        new StorageService()
      );
    }
    return this.fallbackInvestigationsService;
  }

  @Get('pdf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Export defense forensic report as sealed PDF' })
  async downloadPdfReport(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
    @Res() res: Response
  ) {
    const report = await this.repService.generatePdfReport(id, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
      'Content-Length': report.buffer.length,
      'X-Report-Hash': report.reportHash
    });

    res.send(report.buffer);
  }

  @Get('json')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Get investigation forensic report data as JSON' })
  async getJsonReport(@Param('id') id: string) {
    return this.invService.getInvestigationById(id);
  }
}
