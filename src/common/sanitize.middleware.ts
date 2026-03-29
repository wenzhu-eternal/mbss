import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export default class SanitizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanitizeMiddleware.name);

  private readonly sensitiveFields = [
    'password',
    'token',
    'secret',
    'accessToken',
    'refreshToken',
    'sessionKey',
    'openid',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const sanitizedBody = this.sanitizeForLogging(req.body);
    this.logger.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - Body: ${JSON.stringify(sanitizedBody)}`,
    );

    next();
  }

  private sanitizeForLogging(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item));
    }

    const sanitized: Record<string, unknown> = {};
    const dataObj = data as Record<string, unknown>;

    for (const key in dataObj) {
      if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
        if (this.sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized[key] = '***';
        } else if (typeof dataObj[key] === 'object' && dataObj[key] !== null) {
          sanitized[key] = this.sanitizeForLogging(dataObj[key]);
        } else {
          sanitized[key] = dataObj[key];
        }
      }
    }

    return sanitized;
  }
}
