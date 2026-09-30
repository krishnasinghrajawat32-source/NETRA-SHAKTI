import { Controller, Get, Post, Delete, Param, Body, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipientsService, AssignRecipientDto } from './recipients.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guards';
import { UserRole, IUser } from '@netra-shakti/shared-types';

@ApiTags('Document Recipients & Distribution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents/:documentId/recipients')
export class RecipientsController {
  private fallbackRecipientsService: RecipientsService | null = null;

  constructor(
    @Optional() @Inject(RecipientsService) private readonly recipientsService?: RecipientsService
  ) {}

  private get service(): RecipientsService {
    if (this.recipientsService) return this.recipientsService;
    if (!this.fallbackRecipientsService) {
      this.fallbackRecipientsService = new RecipientsService(new AuditService());
    }
    return this.fallbackRecipientsService;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SENDER)
  @ApiOperation({ summary: 'Assign authorized recipient with clearance validation' })
  async assignRecipient(
    @Param('documentId') documentId: string,
    @Body() dto: AssignRecipientDto,
    @CurrentUser() user: IUser
  ) {
    return this.service.assignRecipient(documentId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List authorized recipients for document' })
  async listRecipients(@Param('documentId') documentId: string) {
    return this.service.listRecipientsForDocument(documentId);
  }

  @Delete(':recipientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SENDER)
  @ApiOperation({ summary: 'Revoke recipient access to document' })
  async revokeRecipient(
    @Param('documentId') documentId: string,
    @Param('recipientId') recipientId: string,
    @CurrentUser() user: IUser
  ) {
    return this.service.revokeRecipient(documentId, recipientId, user);
  }
}
