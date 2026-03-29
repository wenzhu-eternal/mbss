import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export class AppError extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    code?: string,
    details?: unknown,
  ) {
    const response: ErrorResponse = { message, code, details };
    super(response, status);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = '未授权，请先登录'): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  static forbidden(message: string = '没有权限访问'): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }

  static notFound(message: string, resource?: string): AppError {
    const msg = resource ? `${resource}不存在` : message;
    return new AppError(msg, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(message, HttpStatus.CONFLICT, 'CONFLICT');
  }

  static internal(message: string = '服务器内部错误', details?: unknown): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', details);
  }
}

export function handleDatabaseError(error: unknown, context?: string): never {
  const dbError = error as { code?: string; sqlMessage?: string; message?: string };

  if (dbError.code === 'ER_DUP_ENTRY') {
    throw AppError.conflict('数据已存在，请检查唯一性约束');
  }

  if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
    throw AppError.badRequest('关联数据不存在');
  }

  const message = context
    ? `${context}失败: ${dbError.sqlMessage || dbError.message || '未知错误'}`
    : dbError.sqlMessage || dbError.message || '数据库操作失败';

  throw AppError.internal(message, { originalError: dbError.code });
}

export function validateExists<T>(entity: T | null, name: string): T {
  if (!entity) {
    throw AppError.notFound(`${name}不存在`, name);
  }
  return entity;
}
