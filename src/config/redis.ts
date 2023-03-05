import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';

const redis: RedisModuleOptions = {
  config: {
    port: 6379,
    host: '127.0.0.1',
    password: '',
  },
};

export default redis;
