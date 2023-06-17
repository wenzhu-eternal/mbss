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
  allowOrigin?: string;
  routerWhitelist?: string[];
  jwtSecret?: JwtModuleOptions;
  session?: SessionOptions;
  fileDirName?: string;
  file?: MulterModuleOptions;
  mysql?: TypeOrmModuleOptions;
  redis?: RedisModuleOptions;
}

const defineConfig = (config: IDefineConfig) => {
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
    : { ...newConfig, ...production };
};

export default defineConfig({
  projectName: 'mbss',
  allowOrigin: 'http://localhost:3000',
  routerWhitelist: ['user/login', 'file/upload'],
  jwtSecret: {
    signOptions: {
      expiresIn: '1d',
    },
  },
  session: {
    secret: '',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  },
  fileDirName: __dirname,
  file: {
    preservePath: true,
  },
  mysql: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '888888',
    entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
    synchronize: true,
    timezone: '+08:00',
    logging: true,
  },
  redis: {
    config: {
      port: 6379,
      host: '127.0.0.1',
      password: '',
    },
  },
});
