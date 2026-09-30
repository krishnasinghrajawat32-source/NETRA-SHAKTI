import { Controller, Get, Post, Query, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guards';
import { UserRole } from '@netra-shakti/shared-types';

@ApiTags('Immutable Provenance Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  private fallbackService: LedgerService | null = null;

  constructor(
    @Optional() @Inject(LedgerService) private readonly ledgerService?: LedgerService
  ) {}

  private get service(): LedgerService {
    if (this.ledgerService) return this.ledgerService;
    if (!this.fallbackService) this.fallbackService = new LedgerService();
    return this.fallbackService;
  }

  @Get('events')
  @ApiOperation({ summary: 'Query immutable ledger event blocks' })
  async getEvents(
    @Query('eventType') eventType?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.getEvents({
      eventType,
      entityType,
      entityId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    });
  }

  @Post('verify')
  @ApiOperation({ summary: 'Execute cryptographic verification of full ledger hash chain' })
  async verifyLedger() {
    return this.service.verifyLedgerIntegrity();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current status of ledger and block sequence' })
  async getStatus() {
    return this.service.getLedgerStatus();
  }
}
