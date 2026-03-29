import { RedisService } from '@liaoliaots/nestjs-redis';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    const redis = this.redisService.getOrThrow();
    const cached = await redis.get(cacheKey);

    if (cached) {
      return new Observable(subscriber => {
        subscriber.next(JSON.parse(cached));
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      tap(data => {
        void redis.setex(cacheKey, 1800, JSON.stringify(data));
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, query, body } = request;
    return `cache:${method}:${url}:${JSON.stringify({ query, body })}`;
  }
}
