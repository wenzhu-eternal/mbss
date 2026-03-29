import { RedisService } from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';

import { CacheService } from '@/common/cache.service';

describe('CacheService', () => {
  let service: CacheService;

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('应该成功获取缓存值', async () => {
      const cachedData = { id: 1, name: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.get<{ id: number; name: string }>('test-key');

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('缓存不存在时应该返回 null', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('JSON 解析失败时应该返回 null', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await service.get('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('应该成功设置缓存值', async () => {
      const data = { id: 1, name: 'test' };
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('test-key', data, 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(data));
    });

    it('应该使用默认 TTL', async () => {
      const data = { id: 1 };
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('test-key', data);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 1800, JSON.stringify(data));
    });

    it('设置缓存失败时应该静默处理', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('test-key', { id: 1 })).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('应该成功删除缓存', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('删除缓存失败时应该静默处理', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del('test-key')).resolves.not.toThrow();
    });
  });

  describe('delPattern', () => {
    it('应该成功删除匹配模式的所有缓存', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValue(3);

      await service.delPattern('test-*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test-*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('没有匹配的键时不应该执行删除', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await service.delPattern('nonexistent-*');

      expect(mockRedis.keys).toHaveBeenCalledWith('nonexistent-*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('删除模式缓存失败时应该静默处理', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(service.delPattern('test-*')).resolves.not.toThrow();
    });
  });

  describe('边缘案例测试', () => {
    describe('get 边缘案例', () => {
      it('应该处理空键名', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await service.get('');

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith('');
      });

      it('应该处理超长键名', async () => {
        const longKey = 'k'.repeat(1000);
        mockRedis.get.mockResolvedValue(null);

        const result = await service.get(longKey);

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith(longKey);
      });

      it('应该处理包含特殊字符的键名', async () => {
        const specialKey = 'key:with:special:chars:*?[]';
        mockRedis.get.mockResolvedValue(null);

        const result = await service.get(specialKey);

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith(specialKey);
      });

      it('应该处理中文键名', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify({ name: '测试' }));

        const result = await service.get('中文键名');

        expect(result).toEqual({ name: '测试' });
      });

      it('应该处理超大缓存数据', async () => {
        const largeData = { items: Array.from({ length: 10000 }, (_, i) => ({ id: i })) };
        mockRedis.get.mockResolvedValue(JSON.stringify(largeData));

        const result = await service.get('large-data');

        expect(result).toEqual(largeData);
      });

      it('应该处理嵌套深层对象', async () => {
        const deepObject = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deep',
                  },
                },
              },
            },
          },
        };
        mockRedis.get.mockResolvedValue(JSON.stringify(deepObject));

        const result = await service.get('deep-object');

        expect(result).toEqual(deepObject);
      });

      it('应该处理空对象', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify({}));

        const result = await service.get('empty-object');

        expect(result).toEqual({});
      });

      it('应该处理数组数据', async () => {
        const arrayData = [1, 2, 3, 'a', 'b', { nested: true }];
        mockRedis.get.mockResolvedValue(JSON.stringify(arrayData));

        const result = await service.get('array-data');

        expect(result).toEqual(arrayData);
      });

      it('应该处理 null 值', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(null));

        const result = await service.get('null-value');

        expect(result).toBeNull();
      });

      it('应该处理布尔值', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(true));

        const result = await service.get('bool-true');

        expect(result).toBe(true);
      });

      it('应该处理数字值', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(12345));

        const result = await service.get('number-value');

        expect(result).toBe(12345);
      });

      it('应该处理字符串值', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify('plain string'));

        const result = await service.get('string-value');

        expect(result).toBe('plain string');
      });

      it('应该处理 Unicode 字符', async () => {
        const unicodeData = { emoji: '😀🎉', chinese: '中文', japanese: '日本語' };
        mockRedis.get.mockResolvedValue(JSON.stringify(unicodeData));

        const result = await service.get('unicode-data');

        expect(result).toEqual(unicodeData);
      });
    });

    describe('set 边缘案例', () => {
      it('应该处理零 TTL', async () => {
        const data = { id: 1 };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('test-key', data, 0);

        expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 0, JSON.stringify(data));
      });

      it('应该处理超大 TTL', async () => {
        const data = { id: 1 };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('test-key', data, Number.MAX_SAFE_INTEGER);

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'test-key',
          Number.MAX_SAFE_INTEGER,
          JSON.stringify(data),
        );
      });

      it('应该处理负数 TTL', async () => {
        const data = { id: 1 };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('test-key', data, -1);

        expect(mockRedis.setex).toHaveBeenCalledWith('test-key', -1, JSON.stringify(data));
      });

      it('应该处理超大对象', async () => {
        const largeObject = {
          items: Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            name: `item-${i}`,
            data: 'x'.repeat(100),
          })),
        };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('large-object', largeObject, 3600);

        expect(mockRedis.setex).toHaveBeenCalled();
      });

      it('应该处理包含循环引用的对象（JSON.stringify 会报错）', async () => {
        const circularObj: any = { name: 'test' };
        circularObj.self = circularObj;

        await expect(service.set('circular', circularObj)).resolves.not.toThrow();
      });

      it('应该处理 undefined 值', async () => {
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('undefined-value', undefined);

        expect(mockRedis.setex).toHaveBeenCalled();
      });

      it('应该处理函数值（JSON.stringify 会忽略）', async () => {
        const objWithFunc = {
          name: 'test',
          method: () => 'test',
        };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('func-value', objWithFunc);

        const callArgs = mockRedis.setex.mock.calls[0];
        const parsedData = JSON.parse(callArgs[2]);
        expect(parsedData.method).toBeUndefined();
        expect(parsedData.name).toBe('test');
      });

      it('应该处理 Date 对象', async () => {
        const objWithDate = {
          date: new Date('2024-01-01'),
        };
        mockRedis.setex.mockResolvedValue('OK');

        await service.set('date-value', objWithDate);

        const callArgs = mockRedis.setex.mock.calls[0];
        const parsedData = JSON.parse(callArgs[2]);
        expect(parsedData.date).toBe('2024-01-01T00:00:00.000Z');
      });
    });

    describe('del 边缘案例', () => {
      it('应该处理删除不存在的键', async () => {
        mockRedis.del.mockResolvedValue(0);

        await service.del('nonexistent-key');

        expect(mockRedis.del).toHaveBeenCalledWith('nonexistent-key');
      });

      it('应该处理空键名删除', async () => {
        mockRedis.del.mockResolvedValue(0);

        await service.del('');

        expect(mockRedis.del).toHaveBeenCalledWith('');
      });

      it('应该处理超长键名删除', async () => {
        const longKey = 'k'.repeat(1000);
        mockRedis.del.mockResolvedValue(0);

        await service.del(longKey);

        expect(mockRedis.del).toHaveBeenCalledWith(longKey);
      });
    });

    describe('delPattern 边缘案例', () => {
      it('应该处理大量匹配键', async () => {
        const manyKeys = Array.from({ length: 1000 }, (_, i) => `key-${i}`);
        mockRedis.keys.mockResolvedValue(manyKeys);
        mockRedis.del.mockResolvedValue(1000);

        await service.delPattern('key-*');

        expect(mockRedis.del).toHaveBeenCalledWith(...manyKeys);
      });

      it('应该处理复杂通配符模式', async () => {
        mockRedis.keys.mockResolvedValue([]);

        await service.delPattern('user:*:session:*');

        expect(mockRedis.keys).toHaveBeenCalledWith('user:*:session:*');
      });

      it('应该处理空模式', async () => {
        mockRedis.keys.mockResolvedValue([]);

        await service.delPattern('');

        expect(mockRedis.keys).toHaveBeenCalledWith('');
      });

      it('应该处理删除失败的情况', async () => {
        mockRedis.keys.mockResolvedValue(['key1', 'key2']);
        mockRedis.del.mockRejectedValue(new Error('Delete failed'));

        await expect(service.delPattern('test-*')).resolves.not.toThrow();
      });
    });
  });
});
