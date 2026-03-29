import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import ErrorLogService from '@/modules/services/errorLog';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: unknown;
  stack?: string;
}

@Catch()
export default class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly errorLogService: ErrorLogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: unknown = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorMessage = resp.message || resp.error || exception.message;
      } else {
        errorMessage = exception.message;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    const errorLog: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    };

    if (exception instanceof Error && process.env.NODE_ENV !== 'production') {
      errorLog.stack = exception.stack;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - ${status}: ${JSON.stringify(errorMessage)}`,
    );

    if (exception instanceof Error && !(exception instanceof HttpException)) {
      this.logger.error(exception.stack);
    }

    await this.saveErrorLog(request, status, errorMessage, exception);

    response.status(HttpStatus.OK).json(errorLog);
  }

  private async saveErrorLog(
    request: Request,
    statusCode: number,
    errorMessage: unknown,
    exception: unknown,
  ): Promise<void> {
    try {
      const message =
        typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);

      await this.errorLogService.reportError(
        {
          source: 'backend',
          errorType: 'http_error',
          message,
          stack: exception instanceof Error ? exception.stack : undefined,
          url: request.url,
          file: request.url,
          extra: {
            ip: request.ip || request.socket.remoteAddress,
            userAgent: request.headers['user-agent'],
            body: request.body,
            query: request.query,
            method: request.method,
            statusCode,
          },
        },
        request.ip || request.socket.remoteAddress,
      );
    } catch (error) {
      this.logger.error(`保存错误日志失败: ${(error as Error).message}`);
    }
  }
}
