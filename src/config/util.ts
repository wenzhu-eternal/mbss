import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { JwtModuleOptions } from '@nestjs/jwt';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { MailerOptions } from '@nestjs-modules/mailer';
import { SessionOptions } from 'express-session';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Writable } from 'stream';

export interface IDefineConfig {
  projectName?: string;
  allowOrigin?: string | string[];
  routerWhitelist?: string[];
  jwtSecret?: JwtModuleOptions;
  session?: SessionOptions;
  file?: MulterModuleOptions;
  uploadDir?: string;
  mysql?: {
    type?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    synchronize?: boolean;
    logging?: boolean;
    [key: string]: unknown;
  };
  redis?: RedisModuleOptions;
  mailer?: MailerOptions;
  weapp?: {
    appId: string;
    secret: string;
  };
  admin?: {
    defaultPassword: string;
    account: string;
  };
}

export const getUploadDir = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? join(process.cwd(), 'dist', 'uploads') : join(process.cwd(), 'uploads');
};

export const createWeappCodeUrl = (
  imageData: { pipe: (destination: Writable) => void },
  uploadDir: string,
): string => {
  const weappCodeUrl = join(uploadDir, 'weappCode.png');
  imageData.pipe(fs.createWriteStream(weappCodeUrl));
  return weappCodeUrl;
};

export const defineConfig = (config: IDefineConfig): IDefineConfig => {
  const { projectName, jwtSecret, session, file, mysql } = config;

  const defaultSecret = String(projectName || 'default-secret-key');
  const uploadDir = getUploadDir();

  const newConfig: IDefineConfig = {
    ...config,
    uploadDir,
    jwtSecret: {
      ...jwtSecret,
      secret: jwtSecret?.secret || defaultSecret,
    },
    session: {
      ...session,
      secret: session?.secret || defaultSecret,
    },
    file: {
      ...file,
      storage:
        file?.storage ||
        diskStorage({
          destination(_, __, cb) {
            cb(null, uploadDir);
          },
          filename: (_, file, cb) => {
            const ext = file.originalname.split('.').pop() || '';
            const baseName = file.originalname.replace(`.${ext}`, '');
            const sanitizedBaseName = baseName
              .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
              .substring(0, 100);
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const safeFilename = `${timestamp}-${random}-${sanitizedBaseName}.${ext}`;
            return cb(null, safeFilename);
          },
        }),
    },
    mysql: {
      ...mysql,
      database: (mysql?.database || String(projectName)) as string,
    },
  };

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return newConfig;
};
