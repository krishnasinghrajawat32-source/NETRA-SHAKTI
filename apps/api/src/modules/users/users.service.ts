import { Injectable, BadRequestException, NotFoundException, Logger, Inject, Optional } from '@nestjs/common';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, ClearanceLevel, UserStatus, AuditEventType } from '@netra-shakti/shared-types';

export interface CreateUserDto {
  username: string;
  email: string;
  displayName: string;
  password?: string;
  role: UserRole;
  department?: string;
  rank?: string;
  unit?: string;
  clearanceLevel?: ClearanceLevel;
}

export interface UpdateUserDto {
  displayName?: string;
  department?: string;
  rank?: string;
  unit?: string;
  clearanceLevel?: ClearanceLevel;
  status?: UserStatus;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private _crypto: CryptoService | null = null;
  private _audit: AuditService | null = null;

  constructor(
    private readonly cryptoService?: CryptoService,
    private readonly auditService?: AuditService
  ) {}

  private get crypto(): CryptoService {
    if (this.cryptoService) return this.cryptoService;
    if (!this._crypto) this._crypto = new CryptoService();
    return this._crypto;
  }

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) this._audit = new AuditService();
    return this._audit;
  }

  async createUser(dto: CreateUserDto, creatorId?: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }]
      }
    });

    if (existing) {
      throw new BadRequestException('Username or email already exists in defense registry');
    }

    const password = dto.password || 'Defense@2026!';
    const passwordHash = await defaultCryptoService.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
        role: dto.role || UserRole.RECIPIENT,
        department: dto.department || 'DEFENSE_INTEL',
        rank: dto.rank || null,
        unit: dto.unit || null,
        clearanceLevel: dto.clearanceLevel || ClearanceLevel.CONFIDENTIAL,
        status: dto.password ? UserStatus.ACTIVE : UserStatus.PASSWORD_CHANGE_REQUIRED
      }
    });

    // Generate cryptographic identity for user
    await this.crypto.generateAndRegisterUserIdentity(user.id);

    await this.audit.log({
      eventType: AuditEventType.USER_CREATED,
      userId: creatorId || user.id,
      resourceType: 'USER',
      resourceId: user.id,
      action: `Created user ${user.username} with role ${user.role} and clearance ${user.clearanceLevel}`,
      status: 'SUCCESS'
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async listUsers(params: {
    role?: UserRole;
    clearanceLevel?: ClearanceLevel;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.clearanceLevel) where.clearanceLevel = params.clearanceLevel;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { displayName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { department: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          role: true,
          department: true,
          rank: true,
          unit: true,
          clearanceLevel: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          cryptoIdentities: {
            select: {
              id: true,
              algorithm: true,
              keyVersion: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        department: true,
        rank: true,
        unit: true,
        clearanceLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        cryptoIdentities: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.department && { department: dto.department }),
        ...(dto.rank && { rank: dto.rank }),
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.clearanceLevel && { clearanceLevel: dto.clearanceLevel }),
        ...(dto.status && { status: dto.status }),
        ...(dto.role && { role: dto.role })
      }
    });

    await this.audit.log({
      eventType: AuditEventType.USER_UPDATED,
      userId: actorId,
      resourceType: 'USER',
      resourceId: id,
      action: `Updated user profile for ${user.username}`,
      status: 'SUCCESS'
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async toggleSuspendUser(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStatus = user.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    // Revoke all active sessions if suspending
    if (newStatus === UserStatus.SUSPENDED) {
      await prisma.userSession.updateMany({
        where: { userId: id },
        data: { isRevoked: true }
      });
    }

    await this.audit.log({
      eventType: AuditEventType.USER_SUSPENDED,
      userId: actorId,
      resourceType: 'USER',
      resourceId: id,
      action: `User ${user.username} status toggled to ${newStatus}`,
      status: 'SUCCESS'
    });

    return { message: `User status updated to ${newStatus}`, status: newStatus };
  }

  async adminResetPassword(id: string, newPassword?: string, actorId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tempPassword = newPassword || `NS#Reset${Math.floor(100000 + Math.random() * 900000)}!`;
    const passwordHash = await defaultCryptoService.hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        status: UserStatus.PASSWORD_CHANGE_REQUIRED
      }
    });

    // Revoke existing sessions
    await prisma.userSession.updateMany({
      where: { userId: id },
      data: { isRevoked: true }
    });

    await this.audit.log({
      eventType: AuditEventType.PASSWORD_CHANGED,
      userId: actorId,
      resourceType: 'USER',
      resourceId: id,
      action: `Admin password reset for user ${user.username}`,
      status: 'SUCCESS'
    });

    return {
      message: 'Password reset successfully',
      temporaryPassword: tempPassword
    };
  }
}
