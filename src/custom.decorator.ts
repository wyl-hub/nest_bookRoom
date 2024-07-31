import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';

// 登录鉴权
export const RequireLogin = () => SetMetadata('require_login', true);
// 权限鉴权
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require_permission', permissions);

// 获取请求对象中的 User对象  （登录鉴权守卫添加）
export const UserInfo = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest()

  if (!request.user) {
    return null
  }
  
  return data ? request.user[data] : request.user
});
