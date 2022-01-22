import { Module } from '@nestjs/common';
import FileModule from './file/file.module';
import UserModule from '@/modules/user/user.module';

@Module({
  imports: [FileModule, UserModule],
})
export default class Modules {}
