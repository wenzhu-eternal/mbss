import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export default class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception.message ||
      exception.message?.message ||
      exception.message?.error ||
      '服务器内部错误';
    const mesLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求失败',
      data: message,
    };

    this.logger.error(`请求失败: ${request.method} ${request.url}`, JSON.stringify(mesLog));
    response.status(HttpStatus.OK).json(mesLog);
  }
}
