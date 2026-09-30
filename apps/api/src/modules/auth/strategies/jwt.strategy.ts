import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { appConfig } from '@netra-shakti/config';
import { prisma } from '@netra-shakti/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. From Authorization Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. From HttpOnly Cookie
        (req: Request) => {
          if (req && req.cookies) {
            return req.cookies['ns_access_token'];
          }
          return null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfig.JWT_SECRET
    });
  }

  async validate(payload: { sub: string; username: string; role: string }) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
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
        updatedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account has been suspended by defense administrator');
    }

    return user;
  }
}
