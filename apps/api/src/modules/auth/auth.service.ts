import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException, Logger, Inject, Optional } from '@nestjs/common';
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
    private readonly jwtService?: JwtService,
    private readonly auditService?: AuditService
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
    const { password, ipAddress, userAgent } = credentials;
    const cleanUsername = (credentials.username || '').trim().toLowerCase();
    const normalizedDot = cleanUsername.replace(/\s+/g, '.');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanUsername },
          { username: normalizedDot }
        ]
      }
    });

    if (!user) {
      await this.audit.log({
        eventType: AuditEventType.LOGIN_FAILED,
        action: `Failed login attempt for identifier: ${cleanUsername}`,
        ipAddress,
        userAgent,
        status: 'FAILURE'
      });
      throw new UnauthorizedException('Incorrect username/email or password');
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
      throw new UnauthorizedException('Incorrect username/email or password');
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

  async register(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    department?: string;
    rank?: string;
    unit?: string;
    clearanceLevel?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { username, email, password, displayName, department, rank, unit, clearanceLevel, ipAddress, userAgent } = data;

    if (!username || !email || !password || !displayName) {
      throw new BadRequestException('Username, email, password, and display name are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long with strong entropy');
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check if username already exists in database
    const existingUser = await prisma.user.findFirst({
      where: { username: trimmedUsername }
    });
    if (existingUser) {
      throw new ConflictException('Username already exists in DEFENCE registry');
    }

    // Check if email already exists in database
    const existingEmail = await prisma.user.findFirst({
      where: { email: trimmedEmail }
    });
    if (existingEmail) {
      throw new ConflictException('Official email is already registered in DEFENCE registry');
    }

    // Hash password with Argon2id
    const passwordHash = await defaultCryptoService.hashPassword(password);

    // Save Real User in database with default safe USER role (Never allow ADMIN/SUPER_ADMIN via public registration)
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: trimmedEmail,
        displayName: displayName.trim(),
        passwordHash,
        role: UserRole.USER || ('USER' as any),
        department: department?.trim() || 'DEFENCE_CYBER_COMMAND',
        rank: rank?.trim() || null,
        unit: unit?.trim() || null,
        clearanceLevel: clearanceLevel || ('CONFIDENTIAL' as any),
        status: UserStatus.ACTIVE
      }
    });

    // Generate asymmetric crypto identity for the registered user
    try {
      const signingKeys = defaultCryptoService.generateSigningKeyPair();
      const encryptionKeys = defaultCryptoService.generateEncryptionKeyPair();

      await prisma.cryptoIdentity.create({
        data: {
          userId: user.id,
          signingPublicKey: signingKeys.publicKey,
          encryptionPublicKey: encryptionKeys.publicKey,
          algorithm: 'Ed25519+RSA-4096-OAEP',
          keyVersion: 1,
          status: 'ACTIVE'
        }
      });
    } catch (keyErr) {
      this.logger.warn(`Crypto identity generation warning: ${(keyErr as Error).message}`);
    }

    await this.audit.log({
      eventType: AuditEventType.USER_CREATED,
      userId: user.id,
      action: `New personnel registered: ${user.username} (${user.email})`,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      message: 'Account successfully registered. You may now log in.',
      user: safeUser
    };
  }
}
