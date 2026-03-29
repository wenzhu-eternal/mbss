import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { defineConfig } from './util';

export default defineConfig({
  projectName: 'mbss',
  allowOrigin: process.env.ALLOW_ORIGIN
    ? process.env.ALLOW_ORIGIN.split(',')
    : 'http://localhost:3000',
  routerWhitelist: [
    'user/getLoginState',
    'user/weappLogin',
    'user/getWeappCodeToLogin',
    'user/login',
    'error-log/reportError',
  ],
  jwtSecret: {
    secret: process.env.JWT_SECRET || '',
    signOptions: {
      expiresIn: '7d',
    },
  },
  session: {
    secret: process.env.SESSION_SECRET || '',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    },
  },
  mysql: {
    type: 'mysql',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mbss',
    entities: [join(__dirname, '../', '**/entities/**.{ts,js}')],
    synchronize: process.env.NODE_ENV === 'development',
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      connectionLimit: 20,
    },
  },
  redis: {
    config: {
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD || '',
    },
  },
  mailer: {
    transport: {
      host: process.env.MAIL_HOST || '',
      port: parseInt(process.env.MAIL_PORT || '', 10),
      secure: true,
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
      },
    },
    defaults: {
      from: '"MBS" mbss@163.com',
    },
    template: {
      dir: join(__dirname, '../templates/email'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  },
  weapp: {
    appId: process.env.WEAPP_APPID || '',
    secret: process.env.WEAPP_SECRET || '',
  },
  admin: {
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || '',
    account: process.env.ADMIN_ACCOUNT || '',
  },
});
