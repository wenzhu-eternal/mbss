import { Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Request } from 'express';

export default function LoggerGlobal(req: Request, _, next: () => void) {
  const { method, path } = req;
  if (method !== 'OPTIONS') {
    Logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${method} ${path}`);

    if (path.includes('/api/log')) {
      Logger.error(req.query.error);
    }
  }
  next();
}
