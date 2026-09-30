import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Inject,
  Optional
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { InvestigationsService, CreateInvestigationDto } from './investigations.service';
import { StorageService } from '../storage/storage.service';
import { WatermarkService } from '../watermark/watermark.service';
import { LedgerService } from '../ledger/ledger.service';
import { MLService } from '../ml/ml.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guards';
import { UserRole, InvestigationStatus, IUser } from '@netra-shakti/shared-types';

@ApiTags('Digital Forensics & Investigations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investigations')
export class InvestigationsController {
  private fallbackInvestigationsService: InvestigationsService | null = null;

  constructor(
    @Optional() @Inject(InvestigationsService) private readonly investigationsService?: InvestigationsService
  ) {}

  private get service(): InvestigationsService {
    if (this.investigationsService) return this.investigationsService;
    if (!this.fallbackInvestigationsService) {
      this.fallbackInvestigationsService = new InvestigationsService(
        new StorageService(),
        new WatermarkService(),
        new LedgerService(new AuditService()),
        new MLService(),
        new AuditService()
      );
    }
    return this.fallbackInvestigationsService;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Create new forensic investigation case' })
  async createInvestigation(
    @Body() dto: CreateInvestigationDto,
    @CurrentUser() user: IUser
  ) {
    return this.service.createInvestigation(dto, user);
  }

  @Post(':id/evidence')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload leaked document/image evidence into investigation case' })
  async uploadEvidence(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: IUser
  ) {
    return this.service.uploadEvidence(id, file, user);
  }

  @Post(':id/analyze')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Run full ML & cryptographic forensic analysis on uploaded evidence' })
  async analyzeInvestigation(
    @Param('id') id: string,
    @CurrentUser() user: IUser
  ) {
    return this.service.runForensicAnalysis(id, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'List forensic investigations' })
  async listInvestigations(
    @Query('status') status?: InvestigationStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.listInvestigations({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Get investigation case details and findings' })
  async getInvestigation(@Param('id') id: string) {
    return this.service.getInvestigationById(id);
  }
}
