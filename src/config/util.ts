import { MulterModuleOptions } from '@nestjs/platform-express';
import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SessionOptions } from 'express-session';
import { JwtModuleOptions } from '@nestjs/jwt';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';

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

export const defineConfig = (config: IDefineConfig) => {
  const { fileDirName, projectName, jwtSecret, session, file, mysql } = config;

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

  const createProjectDir = join(fileDirName, projectName);
  if (!fs.existsSync(createProjectDir)) {
    fs.mkdirSync(createProjectDir, { recursive: true });
  }

  return newConfig;
};
