import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const requirePermission = this.reflector.getAllAndOverride<string[]>(
      'require_permission',
      [context.getClass(), context.getHandler()],
    );

    if (!requirePermission) {
      return true;
    }

    if (!request.user) {
      throw new UnauthorizedException('该用户没有权限访问');
    }

    const user = request.user;
    const permissions = user.permissions;
    for (let i = 0; i < requirePermission.length; ++i) {
      const currentPermission = requirePermission[i];
      const foundPermission = permissions.find(
        (item) => item.code === currentPermission,
      );
      if (!foundPermission) {
        throw new UnauthorizedException('该用户没有权限访问');
      }
    }
    return true;
  }
}
