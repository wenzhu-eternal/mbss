import { Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Request } from 'express';

const logger = new Logger('LoggerMiddleware');

export default function LoggerGlobal(req: Request, _, next: () => void) {
  const { method, path } = req;
  if (method !== 'OPTIONS') {
    if (path.includes('/api/log')) {
      logger.error(req.query.error);
      return;
    }

    logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${method} ${path}`);
  }
  next();
}
