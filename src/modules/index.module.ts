import { Module } from '@nestjs/common';

import UserModule from '@/modules/user/user.module';

import FileModule from './file/file.module';

@Module({
  imports: [FileModule, UserModule],
})
export default class Modules {}
