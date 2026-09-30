import { Controller, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guards';
import { UserRole } from '@netra-shakti/shared-types';

@ApiTags('Cryptography & Key Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crypto')
export class CryptoController {
  private fallbackService: CryptoService | null = null;

  constructor(
    @Optional() @Inject(CryptoService) private readonly cryptoService?: CryptoService
  ) {}

  private get service(): CryptoService {
    if (this.cryptoService) return this.cryptoService;
    if (!this.fallbackService) this.fallbackService = new CryptoService();
    return this.fallbackService;
  }

  @Get('pqc-status')
  @ApiOperation({ summary: 'Get Post-Quantum Cryptography status and algorithms' })
  getPqcStatus() {
    return this.service.getPqcStatus();
  }

  @Get('identities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'List all registered cryptographic identities' })
  listIdentities() {
    return this.service.listIdentities();
  }
}
