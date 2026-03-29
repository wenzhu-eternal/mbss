import { Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Request } from 'express';

const logger = new Logger('LoggerMiddleware');

export default function LoggerGlobal(req: Request, _res: unknown, next: () => void) {
  const { method, path } = req;
  if (method !== 'OPTIONS') {
    logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${method} ${path}`);
  }
  next();
}
