import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  ForbiddenException,
  UnauthorizedException,
  Optional
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { UserRole, ClearanceLevel, IUser } from '@netra-shakti/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CLEARANCE_KEY = 'clearance';
export const RequireClearance = (level: ClearanceLevel) => SetMetadata(CLEARANCE_KEY, level);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication token required or expired');
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account suspended. Contact administrator.');
    }
    return user;
  }
}

const clearanceRank: Record<ClearanceLevel, number> = {
  [ClearanceLevel.UNCLASSIFIED]: 1,
  [ClearanceLevel.RESTRICTED]: 2,
  [ClearanceLevel.CONFIDENTIAL]: 3,
  [ClearanceLevel.SECRET]: 4,
  [ClearanceLevel.TOP_SECRET]: 5
};

@Injectable()
export class RolesGuard implements CanActivate {
  private _reflector: Reflector | null = null;
  constructor(@Optional() private reflector?: Reflector) {}

  private get ref(): Reflector {
    if (this.reflector) return this.reflector;
    if (!this._reflector) this._reflector = new Reflector();
    return this._reflector;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.ref.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // SUPER_ADMIN has access to all roles
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access restricted. Required roles: [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}

@Injectable()
export class ClearanceGuard implements CanActivate {
  private _reflector: Reflector | null = null;
  constructor(@Optional() private reflector?: Reflector) {}

  private get ref(): Reflector {
    if (this.reflector) return this.reflector;
    if (!this._reflector) this._reflector = new Reflector();
    return this._reflector;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredClearance = this.ref.getAllAndOverride<ClearanceLevel>(CLEARANCE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredClearance) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userClearanceVal = clearanceRank[user.clearanceLevel as ClearanceLevel] || 1;
    const requiredClearanceVal = clearanceRank[requiredClearance] || 1;

    if (userClearanceVal < requiredClearanceVal) {
      throw new ForbiddenException(
        `Insufficient security clearance. User level: ${user.clearanceLevel}, Required: ${requiredClearance}`
      );
    }

    return true;
  }
}
