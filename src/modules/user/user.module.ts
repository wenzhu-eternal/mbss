import OConfigModule from '@config/config.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserController from './user.controller';
import UserEntity from './user.entity';
import UserService from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), OConfigModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export default class UserModule {}
