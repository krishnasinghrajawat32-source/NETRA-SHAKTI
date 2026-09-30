import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { appConfig } from '@netra-shakti/config';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, UserStatus, UserRole } from '@netra-shakti/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private _jwt: JwtService | null = null;
  private _audit: AuditService | null = null;

  constructor(
    @Optional() @Inject(JwtService) private readonly jwtService?: JwtService,
    @Optional() @Inject(AuditService) private readonly auditService?: AuditService
  ) {}

  private get jwt(): JwtService {
    if (this.jwtService) return this.jwtService;
    if (!this._jwt) {
      this._jwt = new JwtService({ secret: appConfig.JWT_SECRET || 'netra-shakti-secret-key-2026' });
    }
    return this._jwt;
  }

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) {
      this._audit = new AuditService();
    }
    return this._audit;
  }

  async login(credentials: {
    username: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { username, password, ipAddress, userAgent } = credentials;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    });

    if (!user) {
      await this.audit.log({
        eventType: AuditEventType.LOGIN_FAILED,
        action: `Failed login attempt for username: ${username}`,
        ipAddress,
        userAgent,
        status: 'FAILURE'
      });
      throw new UnauthorizedException('Invalid cryptographic credentials');
    }

    const isPasswordValid = await defaultCryptoService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.audit.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        action: `Invalid password for user: ${user.username}`,
        ipAddress,
        userAgent,
        status: 'FAILURE'
      });
      throw new UnauthorizedException('Invalid cryptographic credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      await this.audit.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        action: `Login attempted on suspended account: ${user.username}`,
        ipAddress,
        userAgent,
        status: 'FAILURE'
      });
      throw new ForbiddenException('Account has been suspended by defense administrator');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      clearanceLevel: user.clearanceLevel
    };

    const accessToken = this.jwt.sign(payload, {
      secret: appConfig.JWT_SECRET,
      expiresIn: '15m'
    });

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = defaultCryptoService.hash(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt
      }
    });

    const combinedRefreshToken = `${session.id}.${rawRefreshToken}`;

    await this.audit.log({
      eventType: AuditEventType.LOGIN_SUCCESS,
      userId: user.id,
      action: `User ${user.username} authenticated successfully (${user.role})`,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      accessToken,
      refreshToken: combinedRefreshToken,
      user: safeUser,
      passwordChangeRequired: user.status === UserStatus.PASSWORD_CHANGE_REQUIRED
    };
  }

  async refreshToken(combinedRefreshToken: string, ipAddress?: string, userAgent?: string) {
    if (!combinedRefreshToken || !combinedRefreshToken.includes('.')) {
      throw new UnauthorizedException('Invalid refresh session token');
    }

    const [sessionId, rawToken] = combinedRefreshToken.split('.');
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session || session.isRevoked || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const computedHash = defaultCryptoService.hash(rawToken);
    if (computedHash !== session.refreshTokenHash) {
      // Possible token replay attack - revoke session immediately
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isRevoked: true }
      });
      throw new UnauthorizedException('Session compromised');
    }

    // Rotate refresh token
    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = defaultCryptoService.hash(newRawRefreshToken);

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent
      }
    });

    const user = session.user;
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      clearanceLevel: user.clearanceLevel
    };

    const accessToken = this.jwt.sign(payload, {
      secret: appConfig.JWT_SECRET,
      expiresIn: '15m'
    });

    const newCombinedRefreshToken = `${session.id}.${newRawRefreshToken}`;

    return {
      accessToken,
      refreshToken: newCombinedRefreshToken
    };
  }

  async logout(combinedRefreshToken?: string, userId?: string) {
    if (combinedRefreshToken && combinedRefreshToken.includes('.')) {
      const [sessionId] = combinedRefreshToken.split('.');
      await prisma.userSession.updateMany({
        where: { id: sessionId },
        data: { isRevoked: true }
      });
    } else if (userId) {
      await prisma.userSession.updateMany({
        where: { userId },
        data: { isRevoked: true }
      });
    }

    return { message: 'Session successfully revoked' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long with strong entropy');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentValid = await defaultCryptoService.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password incorrect');
    }

    const newHash = await defaultCryptoService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        status: user.status === UserStatus.PASSWORD_CHANGE_REQUIRED ? UserStatus.ACTIVE : user.status
      }
    });

    await this.audit.log({
      eventType: AuditEventType.PASSWORD_CHANGED,
      userId,
      action: `Password changed for user ${user.username}`,
      status: 'SUCCESS'
    });

    return { message: 'Password changed successfully' };
  }
}
