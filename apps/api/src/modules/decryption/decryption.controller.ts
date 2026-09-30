import { Controller, Post, Get, Param, Query, Req, Res, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DecryptionService } from './decryption.service';
import { StorageService } from '../storage/storage.service';
import { WatermarkService } from '../watermark/watermark.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, CurrentUser } from '../../common/guards/auth.guards';
import { IUser, DecryptionSessionStatus } from '@netra-shakti/shared-types';

@ApiTags('Secure Decryption & Provenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DecryptionController {
  private fallbackDecryptionService: DecryptionService | null = null;

  constructor(
    @Optional() @Inject(DecryptionService) private readonly decryptionService?: DecryptionService
  ) {}

  private get service(): DecryptionService {
    if (this.decryptionService) return this.decryptionService;
    if (!this.fallbackDecryptionService) {
      this.fallbackDecryptionService = new DecryptionService(
        new StorageService(),
        new WatermarkService(),
        new LedgerService(new AuditService()),
        new AuditService()
      );
    }
    return this.fallbackDecryptionService;
  }

  @Post('documents/:id/decryption-sessions')
  @ApiOperation({ summary: 'Initiate secure decryption workflow and forensic watermark issuance' })
  async startDecryption(
    @Param('id') documentId: string,
    @CurrentUser() user: IUser,
    @Req() req: Request
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceFingerprint = (req.headers['x-device-fingerprint'] as string) || undefined;

    return this.service.startDecryptionWorkflow(documentId, user, {
      ipAddress,
      userAgent,
      deviceFingerprint
    });
  }

  @Get('decryption-sessions')
  @ApiOperation({ summary: 'List decryption sessions' })
  async listSessions(
    @CurrentUser() user: IUser,
    @Query('documentId') documentId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: DecryptionSessionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.listSessions(
      {
        documentId,
        recipientId,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50
      },
      user
    );
  }

  @Get('decryption-sessions/:id')
  @ApiOperation({ summary: 'Get decryption session details, watermark, signature and ledger event' })
  async getSession(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.service.getSessionById(id, user);
  }

  @Get('decryption-sessions/:id/stream')
  @ApiOperation({ summary: 'Stream issued watermarked PDF document directly to authorized recipient' })
  async streamIssuedDocument(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
    @Res() res: Response
  ) {
    const file = await this.service.getIssuedDocumentBuffer(id, user);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Length': file.buffer.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });

    res.send(file.buffer);
  }
}
