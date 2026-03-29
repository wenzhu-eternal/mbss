import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';

import { RequestService } from '@/common/request.service';

describe('RequestService', () => {
  let service: RequestService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRequest', () => {
    it('应该成功发起 GET 请求', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRequest('https://api.example.com/users/1');

      expect(result).toEqual({ id: 1, name: 'test' });
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        undefined,
      );
    });

    it('应该支持传递配置参数', async () => {
      const mockResponse = { data: { result: 'success' } };
      const config = { headers: { Authorization: 'Bearer token' } };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRequest('https://api.example.com/protected', config);

      expect(result).toEqual({ result: 'success' });
      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/protected', config);
    });

    it('请求失败时应该抛出错误', async () => {
      const error = new Error('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getRequest('https://api.example.com/error')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('postRequest', () => {
    it('应该成功发起 POST 请求', async () => {
      const mockResponse = { data: { id: 1, status: 'created' } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.postRequest('https://api.example.com/users', {
        name: 'test',
        email: 'test@example.com',
      });

      expect(result).toEqual({ id: 1, status: 'created' });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        { name: 'test', email: 'test@example.com' },
        undefined,
      );
    });

    it('应该支持传递配置参数', async () => {
      const mockResponse = { data: { result: 'success' } };
      const config = { headers: { 'Content-Type': 'application/json' } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.postRequest(
        'https://api.example.com/data',
        { key: 'value' },
        config,
      );

      expect(result).toEqual({ result: 'success' });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.example.com/data',
        { key: 'value' },
        config,
      );
    });

    it('请求失败时应该抛出错误', async () => {
      const error = new Error('Server error');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.postRequest('https://api.example.com/error', {})).rejects.toThrow(
        'Server error',
      );
    });

    it('应该支持不带请求体的 POST 请求', async () => {
      const mockResponse = { data: { status: 'ok' } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.postRequest('https://api.example.com/action');

      expect(result).toEqual({ status: 'ok' });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.example.com/action',
        undefined,
        undefined,
      );
    });
  });

  describe('边缘案例测试', () => {
    describe('getRequest 边缘案例', () => {
      it('应该处理超长 URL', async () => {
        const longUrl = `https://api.example.com/${'path/'.repeat(100)}resource`;
        const mockResponse = { data: { result: 'success' } };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest(longUrl);

        expect(result).toEqual({ result: 'success' });
      });

      it('应该处理包含查询参数的 URL', async () => {
        const urlWithQuery = 'https://api.example.com/search?q=test&page=1&limit=10';
        const mockResponse = { data: { items: [] } };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest(urlWithQuery);

        expect(result).toEqual({ items: [] });
      });

      it('应该处理包含特殊字符的 URL', async () => {
        const specialUrl = 'https://api.example.com/path%20with%20spaces/and%2Fencoded';
        const mockResponse = { data: { result: 'success' } };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest(specialUrl);

        expect(result).toEqual({ result: 'success' });
      });

      it('应该处理中文 URL', async () => {
        const chineseUrl = 'https://api.example.com/搜索/测试';
        const mockResponse = { data: { result: 'success' } };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest(chineseUrl);

        expect(result).toEqual({ result: 'success' });
      });

      it('应该处理空响应数据', async () => {
        const mockResponse = { data: null };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/empty');

        expect(result).toBeNull();
      });

      it('应该处理空对象响应', async () => {
        const mockResponse = { data: {} };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/empty-object');

        expect(result).toEqual({});
      });

      it('应该处理数组响应', async () => {
        const mockResponse = { data: [1, 2, 3] };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/array');

        expect(result).toEqual([1, 2, 3]);
      });

      it('应该处理深层嵌套响应', async () => {
        const mockResponse = {
          data: {
            level1: {
              level2: {
                level3: {
                  value: 'deep',
                },
              },
            },
          },
        };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/nested');

        expect(result).toEqual(mockResponse.data);
      });

      it('应该处理大响应数据', async () => {
        const largeData = {
          items: Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `item-${i}` })),
        };
        const mockResponse = { data: largeData };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/large');

        expect(result.items.length).toBe(10000);
      });

      it('应该处理带认证头的请求', async () => {
        const mockResponse = { data: { authenticated: true } };
        const config = {
          headers: {
            Authorization: 'Bearer very-long-token-string',
            'X-Custom-Header': 'custom-value',
          },
        };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const result = await service.getRequest('https://api.example.com/protected', config);

        expect(result).toEqual({ authenticated: true });
        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://api.example.com/protected',
          config,
        );
      });

      it('应该处理超时错误', async () => {
        const error = new Error('Timeout');
        mockHttpService.get.mockReturnValue(throwError(() => error));

        await expect(service.getRequest('https://api.example.com/timeout')).rejects.toThrow(
          'Timeout',
        );
      });

      it('应该处理 404 错误', async () => {
        const error = new Error('Not Found');
        mockHttpService.get.mockReturnValue(throwError(() => error));

        await expect(service.getRequest('https://api.example.com/notfound')).rejects.toThrow(
          'Not Found',
        );
      });

      it('应该处理 500 错误', async () => {
        const error = new Error('Internal Server Error');
        mockHttpService.get.mockReturnValue(throwError(() => error));

        await expect(service.getRequest('https://api.example.com/error')).rejects.toThrow(
          'Internal Server Error',
        );
      });

      it('应该处理网络断开错误', async () => {
        const error = new Error('Network Error');
        mockHttpService.get.mockReturnValue(throwError(() => error));

        await expect(service.getRequest('https://api.example.com/network')).rejects.toThrow(
          'Network Error',
        );
      });

      it('应该处理 CORS 错误', async () => {
        const error = new Error('CORS policy blocked');
        mockHttpService.get.mockReturnValue(throwError(() => error));

        await expect(service.getRequest('https://api.example.com/cors')).rejects.toThrow(
          'CORS policy blocked',
        );
      });
    });

    describe('postRequest 边缘案例', () => {
      it('应该处理超长 URL', async () => {
        const longUrl = `https://api.example.com/${'path/'.repeat(100)}resource`;
        const mockResponse = { data: { result: 'success' } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest(longUrl, { data: 'test' });

        expect(result).toEqual({ result: 'success' });
      });

      it('应该处理大请求体', async () => {
        const largeBody = {
          items: Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) })),
        };
        const mockResponse = { data: { created: true } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/bulk', largeBody);

        expect(result).toEqual({ created: true });
      });

      it('应该处理空请求体', async () => {
        const mockResponse = { data: { status: 'ok' } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/action', {});

        expect(result).toEqual({ status: 'ok' });
      });

      it('应该处理 null 请求体', async () => {
        const mockResponse = { data: { status: 'ok' } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/action', null);

        expect(result).toEqual({ status: 'ok' });
      });

      it('应该处理嵌套对象请求体', async () => {
        const nestedBody = {
          user: {
            profile: {
              name: '张三',
              address: {
                city: '北京',
                street: '长安街',
              },
            },
          },
        };
        const mockResponse = { data: { created: true } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/users', nestedBody);

        expect(result).toEqual({ created: true });
      });

      it('应该处理数组请求体', async () => {
        const arrayBody = [1, 2, 3, 4, 5];
        const mockResponse = { data: { sum: 15 } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/sum', arrayBody);

        expect(result).toEqual({ sum: 15 });
      });

      it('应该处理包含特殊字符的请求体', async () => {
        const specialBody = {
          text: "Hello <script>alert('xss')</script>",
          symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
        };
        const mockResponse = { data: { received: true } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/text', specialBody);

        expect(result).toEqual({ received: true });
      });

      it('应该处理包含 Unicode 的请求体', async () => {
        const unicodeBody = {
          emoji: '😀🎉🚀',
          chinese: '中文测试',
          japanese: '日本語テスト',
        };
        const mockResponse = { data: { received: true } };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest('https://api.example.com/unicode', unicodeBody);

        expect(result).toEqual({ received: true });
      });

      it('应该处理带认证头的请求', async () => {
        const mockResponse = { data: { authenticated: true } };
        const config = {
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
        };
        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.postRequest(
          'https://api.example.com/protected',
          { data: 'test' },
          config,
        );

        expect(result).toEqual({ authenticated: true });
      });

      it('应该处理超时错误', async () => {
        const error = new Error('Timeout');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(service.postRequest('https://api.example.com/timeout', {})).rejects.toThrow(
          'Timeout',
        );
      });

      it('应该处理 400 错误', async () => {
        const error = new Error('Bad Request');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(service.postRequest('https://api.example.com/bad', {})).rejects.toThrow(
          'Bad Request',
        );
      });

      it('应该处理 401 错误', async () => {
        const error = new Error('Unauthorized');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(
          service.postRequest('https://api.example.com/unauthorized', {}),
        ).rejects.toThrow('Unauthorized');
      });

      it('应该处理 403 错误', async () => {
        const error = new Error('Forbidden');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(service.postRequest('https://api.example.com/forbidden', {})).rejects.toThrow(
          'Forbidden',
        );
      });

      it('应该处理 429 错误（请求过多）', async () => {
        const error = new Error('Too Many Requests');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(
          service.postRequest('https://api.example.com/rate-limited', {}),
        ).rejects.toThrow('Too Many Requests');
      });

      it('应该处理 503 错误（服务不可用）', async () => {
        const error = new Error('Service Unavailable');
        mockHttpService.post.mockReturnValue(throwError(() => error));

        await expect(
          service.postRequest('https://api.example.com/unavailable', {}),
        ).rejects.toThrow('Service Unavailable');
      });
    });
  });
});
