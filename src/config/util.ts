import { MulterModuleOptions } from '@nestjs/platform-express';
import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SessionOptions } from 'express-session';
import { JwtModuleOptions } from '@nestjs/jwt';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';

import production from './config.production';

export interface IDefineConfig {
  projectName?: string;
  allowOrigin?: string | string[];
  routerWhitelist?: string[];
  jwtSecret?: JwtModuleOptions;
  session?: SessionOptions;
  fileDirName?: string;
  file?: MulterModuleOptions;
  mysql?: TypeOrmModuleOptions;
  redis?: RedisModuleOptions;
}

function mergeObjects(obj1, obj2) {
  const merged = { ...obj1 };

  for (const key in obj2) {
    if (typeof obj1[key] === 'object' || typeof obj2[key] === 'object') {
      merged[key] = mergeObjects(obj1[key], obj2[key]);
    } else {
      merged[key] = obj2[key];
    }
  }

  return merged;
}

export const defineConfig = (config: IDefineConfig) => {
  const { projectName, fileDirName, jwtSecret, session, file, mysql } = config;

  const createProjectDir = join(fileDirName, projectName);
  if (!fs.existsSync(createProjectDir)) fs.mkdirSync(createProjectDir);

  const newConfig: IDefineConfig = {
    ...config,
    jwtSecret: {
      ...jwtSecret,
      secret: jwtSecret.secret || projectName,
    },
    session: {
      ...session,
      secret: session.secret || projectName,
    },
    file: {
      ...file,
      storage:
        file.storage ||
        diskStorage({
          destination(_, __, cb) {
            cb(null, join(fileDirName, projectName));
          },
          filename: (_, file, cb) => {
            return cb(null, `${new Date().getTime()}-${file.originalname}`);
          },
        }),
    },
    mysql: {
      ...mysql,
      database: mysql.database || (projectName as any),
    },
  };

  return process.env.NODE_ENV === 'development'
    ? newConfig
    : mergeObjects(newConfig, production);
};
