import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger, Module } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as dayjs from 'dayjs';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

import config from '@/config/config.default';

@WebSocketGateway({
  cors: { origin: config.allowOrigin },
})
class EvensGateway {
  private readonly redis: Redis;
  private readonly logger = new Logger(EvensGateway.name);

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  @SubscribeMessage('addSocket')
  onAddSocket(
    @ConnectedSocket() { id }: Socket,
    @MessageBody() { userId }: { userId: number },
  ): void {
    if (userId) {
      void this.redis.hset('socket', String(userId), JSON.stringify({ socketId: id }));
      this.logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ID为${userId}用户进行socket连接`);
    }
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_unknown: unknown, @MessageBody() { userId }: { userId: number }): void {
    if (userId) {
      void this.redis.hdel('socket', String(userId));
      this.logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ID为${userId}用户断开socket连接`);
    }
  }
}

@Module({
  providers: [EvensGateway],
})
export default class EventsModule {}
