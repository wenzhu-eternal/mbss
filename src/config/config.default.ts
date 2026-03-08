import { join } from 'path';
import { defineConfig } from './util';

export default defineConfig({
  projectName: 'mbss',
  allowOrigin: process.env.ALLOW_ORIGIN || 'http://localhost:3000',
  routerWhitelist: ['user/login', 'user/loginOut', 'file/upload'],
  jwtSecret: {
    secret: process.env.JWT_SECRET || 'mbss-jwt-secret-key',
    signOptions: {
      expiresIn: '7d',
    },
  },
  session: {
    secret: process.env.SESSION_SECRET || 'mbss-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  },
  fileDirName: process.env.FILE_DIR_NAME || join(__dirname, '../../uploads'),
  file: {
    preservePath: true,
  },
  mysql: {
    type: 'mysql',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '888888',
    database: process.env.MYSQL_DATABASE || 'mbss',
    entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
    synchronize: process.env.NODE_ENV !== 'production',
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development',
  },
  redis: {
    config: {
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD || '',
    },
  },
});
