import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

export function Cacheable(key?: string, ttl: number = 1800) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(CACHE_KEY_METADATA, key || `${target.constructor.name}:${propertyKey}`);
    SetMetadata(CACHE_TTL_METADATA, ttl);
    return descriptor;
  };
}
