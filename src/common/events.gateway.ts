import { getAllowOrigin } from '@/config/proxy';
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

@WebSocketGateway({
  cors: { origin: getAllowOrigin() },
})
class EvensGateway {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  @SubscribeMessage('addSocket')
  onAddSocket(
    @ConnectedSocket() { id }: Socket,
    @MessageBody() { userId }: { userId: number },
  ): void {
    if (userId) {
      this.redis.hset('socket', {
        [userId]: JSON.stringify({ socketId: id }),
      });
      Logger.log(
        `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 用户${userId}进行socket`,
      );
    }
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_, @MessageBody() { userId }: { userId: number }): void {
    if (userId) {
      this.redis.hdel('socket', String(userId));
      Logger.log(
        `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 用户${userId}取消socket`,
      );
    }
  }
}

@Module({
  providers: [EvensGateway],
})
export default class EventsModule {}
