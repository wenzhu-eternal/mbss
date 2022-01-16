import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const database: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '888888',
  database: 'mbss',
  entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
  synchronize: true,
  timezone: '+08:00',
  logging: true,
};

export default database;
