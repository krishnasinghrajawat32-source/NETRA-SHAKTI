import { Controller, Get, Post, Body, Query, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WatermarkService } from './watermark.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guards';
import { UserRole } from '@netra-shakti/shared-types';

@ApiTags('Watermark Registry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('watermarks')
export class WatermarkController {
  private fallbackService: WatermarkService | null = null;

  constructor(
    @Optional() @Inject(WatermarkService) private readonly watermarkService?: WatermarkService
  ) {}

  private get service(): WatermarkService {
    if (this.watermarkService) return this.watermarkService;
    if (!this.fallbackService) this.fallbackService = new WatermarkService();
    return this.fallbackService;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.SENDER)
  @ApiOperation({ summary: 'List registered forensic watermarks and payloads' })
  async listWatermarks(
    @Query('documentId') documentId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.listWatermarks({
      documentId,
      recipientId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    });
  }

  @Post('decode-token')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Decode and cryptographically verify raw watermark token' })
  decodeToken(@Body() body: { token: string }) {
    const payload = this.service.core.decodePayload(body.token);
    return {
      isValid: !!payload,
      payload
    };
  }

  @Post('test-resilience')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.SENDER, UserRole.RECIPIENT)
  @ApiOperation({ summary: 'Run forensic resilience lab benchmark against transformations' })
  async testResilience(
    @Body() body: { watermarkIdOrSessionId?: string; transformations?: string[] }
  ) {
    return this.service.runResilienceBenchmark(body.watermarkIdOrSessionId, body.transformations);
  }
}
