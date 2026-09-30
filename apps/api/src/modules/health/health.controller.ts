import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('System Diagnostics & Health')
@Controller('system')
export class HealthController {
  constructor(
    @Optional() @Inject(HealthService) private readonly healthService?: HealthService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get live health status of all security infrastructure services' })
  async getHealth() {
    const service = this.healthService || new HealthService();
    return service.getSystemHealth();
  }
}
