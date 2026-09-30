import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guards';
import { UserRole, ClearanceLevel, UserStatus, IUser } from '@netra-shakti/shared-types';

@ApiTags('Users & Clearances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  private fallbackUsersService: UsersService | null = null;

  constructor(
    @Optional() @Inject(UsersService) private readonly usersService?: UsersService
  ) {}

  private get service(): UsersService {
    if (this.usersService) return this.usersService;
    if (!this.fallbackUsersService) {
      this.fallbackUsersService = new UsersService(new CryptoService(), new AuditService());
    }
    return this.fallbackUsersService;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new user with clearance level and cryptographic identity' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: IUser) {
    return this.service.createUser(dto, user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SENDER, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'List users with filters' })
  async listUsers(
    @Query('role') role?: UserRole,
    @Query('clearanceLevel') clearanceLevel?: ClearanceLevel,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.listUsers({
      role,
      clearanceLevel,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR)
  @ApiOperation({ summary: 'Get user details by ID' })
  async getUserById(@Param('id') id: string) {
    return this.service.getUserById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user attributes and clearance' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: IUser
  ) {
    return this.service.updateUser(id, dto, user.id);
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active/suspended state and revoke sessions' })
  async toggleSuspendUser(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.service.toggleSuspendUser(id, user.id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin reset user password' })
  async adminResetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
    @CurrentUser() user: IUser
  ) {
    return this.service.adminResetPassword(id, body?.newPassword, user.id);
  }
}
