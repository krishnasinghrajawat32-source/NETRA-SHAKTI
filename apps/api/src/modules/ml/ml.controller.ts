import { Controller, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MLService } from './ml.service';
import { JwtAuthGuard } from '../../common/guards/auth.guards';

@ApiTags('ML Forensic Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ml')
export class MLController {
  private fallbackService: MLService | null = null;

  constructor(
    @Optional() @Inject(MLService) private readonly mlService?: MLService
  ) {}

  private get service(): MLService {
    if (this.mlService) return this.mlService;
    if (!this.fallbackService) this.fallbackService = new MLService();
    return this.fallbackService;
  }

  @Get('health')
  @ApiOperation({ summary: 'Check status of ML Forensic Service' })
  async checkHealth() {
    return this.service.checkHealth();
  }

  @Get('models')
  @ApiOperation({ summary: 'List registered ML forensic models and performance benchmarks' })
  async listModels() {
    return this.service.listModels();
  }
}
