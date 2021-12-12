import { Logger } from "@nestjs/common";
import * as dayjs from "dayjs";
import { Request } from "express";

export function LoggerGlobal(req: Request, _, next: () => void) {
  const { method, path } = req;
  if (method !== 'OPTIONS') {
    Logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${method} ${path}`);
  }
  next();
}