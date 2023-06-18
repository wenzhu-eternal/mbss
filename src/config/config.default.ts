import { join } from 'path';
import { defineConfig } from './util';

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
