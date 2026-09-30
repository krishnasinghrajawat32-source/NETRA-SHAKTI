import { Controller, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { HealthService } from '../health/health.service';
import { JwtAuthGuard } from '../../common/guards/auth.guards';

@ApiTags('Dashboard & Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  private fallbackService: DashboardService | null = null;

  constructor(
    @Optional() @Inject(DashboardService) private readonly dashboardService?: DashboardService
  ) {}

  private get service(): DashboardService {
    if (this.dashboardService) return this.dashboardService;
    if (!this.fallbackService) this.fallbackService = new DashboardService(new HealthService());
    return this.fallbackService;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get live database-backed dashboard metrics and timeline data' })
  async getDashboardStats() {
    return this.service.getDashboardStats();
  }
}
