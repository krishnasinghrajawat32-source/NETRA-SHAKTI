import { Controller, Post, Body, Req, Res, Get, UseGuards, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard, CurrentUser } from '../../common/guards/auth.guards';
import { IUser } from '@netra-shakti/shared-types';
import { appConfig } from '@netra-shakti/config';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  private fallbackAuthService: AuthService | null = null;

  constructor(
    @Optional() @Inject(AuthService) private readonly authService?: AuthService
  ) {}

  private get service(): AuthService {
    if (this.authService) return this.authService;
    if (!this.fallbackAuthService) {
      this.fallbackAuthService = new AuthService(
        new JwtService({ secret: appConfig.JWT_SECRET || 'netra-shakti-secret-key-2026' }),
        new AuditService()
      );
    }
    return this.fallbackAuthService;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new personnel account with DEFENCE credentials' })
  async register(
    @Body() body: {
      username: string;
      email: string;
      password: string;
      displayName: string;
      department?: string;
      rank?: string;
      unit?: string;
      clearanceLevel?: any;
    },
    @Req() req: Request
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.service.register({
      ...body,
      ipAddress,
      userAgent
    });
  }

  @Post('signup')
  @ApiOperation({ summary: 'Public registration alias' })
  async signup(@Body() body: any, @Req() req: Request) {
    return this.register(body, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with DEFENCE credentials' })
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.service.login({
      username: body.username,
      password: body.password,
      ipAddress,
      userAgent
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/'
    };

    res.cookie('ns_access_token', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('ns_refresh_token', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate and refresh access token session' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['ns_refresh_token'] || req.body?.refreshToken;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.service.refreshToken(refreshToken, ipAddress, userAgent);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/'
    };

    res.cookie('ns_access_token', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
      path: '/'
    });

    res.cookie('ns_refresh_token', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke active session and clear cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['ns_refresh_token'] || req.body?.refreshToken;
    await this.service.logout(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/'
    };

    res.clearCookie('ns_access_token', cookieOptions);
    res.clearCookie('ns_refresh_token', cookieOptions);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user identity and clearance' })
  async getMe(@CurrentUser() user: IUser) {
    return user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @CurrentUser() user: IUser,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.service.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
