import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter<T> implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.statusCode = exception.getStatus();

    let data = exception.message;
    let message = ''
    const res = exception.getResponse() as { message: string[] };
    if (
      Object.prototype.toString.call(res.message) === '[object Array]' &&
      res.message.length > 0
    ) {
      data = res.message[0]
    }
    // refreshToken 失效 重新登录
    if (data === 'token已失效,请重新登录') {
      message = 'refused'
    }
    // token 失效, 刷新token
    if (data === 'token已失效') {
      message = 'invalid'
    }
    response
      .json({
        code: exception.getStatus(),
        message: message || 'error',
        data,
      })
      .end();
  }
}
