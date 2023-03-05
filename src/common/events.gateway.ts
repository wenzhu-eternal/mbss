import { getAllowOrigin } from '@/config/proxy';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
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
    if (userId)
      this.redis.hset('socket', {
        [userId]: JSON.stringify({ socketId: id }),
      });
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_, @MessageBody() { userId }: { userId: number }): void {
    if (userId) this.redis.hdel('socket', String(userId));
  }
}

@Module({
  providers: [EvensGateway],
})
export default class EventsModule {}
