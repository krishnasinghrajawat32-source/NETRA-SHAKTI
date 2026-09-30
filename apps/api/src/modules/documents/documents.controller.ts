import {
  Controller,
  Get,
  Post,
  Delete,
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
import { DocumentsService, UploadDocumentDto } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guards';
import { UserRole, DocumentClassification, DocumentStatus, IUser } from '@netra-shakti/shared-types';

@ApiTags('Confidential Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  private fallbackDocumentsService: DocumentsService | null = null;

  constructor(
    @Optional() @Inject(DocumentsService) private readonly documentsService?: DocumentsService
  ) {}

  private get service(): DocumentsService {
    if (this.documentsService) return this.documentsService;
    if (!this.fallbackDocumentsService) {
      this.fallbackDocumentsService = new DocumentsService(new StorageService(), new AuditService());
    }
    return this.fallbackDocumentsService;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SENDER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload, validate, AES-256 encrypt and store confidential PDF' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: IUser
  ) {
    return this.service.uploadAndEncryptDocument(file, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List accessible documents based on role and security clearance' })
  async listDocuments(
    @CurrentUser() user: IUser,
    @Query('classification') classification?: DocumentClassification,
    @Query('status') status?: DocumentStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.listDocuments(
      {
        classification,
        status,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50
      },
      user
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and security policy' })
  async getDocumentById(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.service.getDocumentById(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SENDER)
  @ApiOperation({ summary: 'Delete document and purge encrypted object key' })
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.service.deleteDocument(id, user);
  }
}
