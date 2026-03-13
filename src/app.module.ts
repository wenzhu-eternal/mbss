import { Module } from '@nestjs/common';

import EventsModule from '@/common/events.gateway';
import OConfigModule from '@/config/config.module';
import Modules from '@/modules/index.module';

@Module({
  imports: [OConfigModule, EventsModule, Modules],
})
export default class AppModule {}
