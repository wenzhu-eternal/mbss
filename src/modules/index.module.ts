import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileContentValidator } from '@/common/file-content-validator';
import MailModule from '@/common/mail.service';
import { RequestService } from '@/common/request.service';
import TasksModule from '@/common/tasks.service';
import OConfigModule from '@/config/config.module';

import ErrorLogController from './controllers/errorLog';
import FileController from './controllers/file';
import UserController from './controllers/user';
import ErrorLogEntity from './entities/errorLog';
import ErrorWhitelistEntity from './entities/errorWhitelist';
import RoleEntity from './entities/role';
import UserEntity from './entities/user';
import AuthService from './services/auth';
import ErrorLogService from './services/errorLog';
import RoleService from './services/role';
import UserService from './services/user';

@Module({
  imports: [
    OConfigModule,
    TypeOrmModule.forFeature([
      RoleEntity,
      UserEntity,
      ErrorLogEntity,
      ErrorWhitelistEntity,
    ]),
    TasksModule,
    MailModule,
  ],
  controllers: [
    UserController,
    FileController,
    ErrorLogController,
  ],
  providers: [
    UserService,
    AuthService,
    RoleService,
    RequestService,
    ErrorLogService,
    FileContentValidator,
  ],
  exports: [UserService, AuthService, RoleService, ErrorLogService],
})
export default class Modules {}
