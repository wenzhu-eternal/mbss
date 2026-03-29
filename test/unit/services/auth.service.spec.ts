import { RedisService } from '@liaoliaots/nestjs-redis';
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RequestService } from '@/common/request.service';
import RoleEntity from '@/modules/entities/role';
import UserEntity from '@/modules/entities/user';
import AuthService from '@/modules/services/auth';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  const mockRequestService = {
    getRequest: jest.fn(),
    postRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RequestService,
          useValue: mockRequestService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('应该成功登录', async () => {
      const dto = {
        account: 'admin',
        password: '123456',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        account: 'admin',
        password: '$2b$10$hashedpassword',
        isDisable: false,
      });

      const bcrypt = jest.requireMock('bcrypt');
      bcrypt.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-token');
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.login(dto);

      expect(result.id).toBe(1);
      expect(result.token).toBe('mock-token');
    });

    it('用户不存在时应该抛出异常', async () => {
      const dto = {
        account: 'nonexistent',
        password: '123456',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(HttpException);
      await expect(service.login(dto)).rejects.toThrow('用户名或密码错误');
    });

    it('密码错误时应该抛出异常', async () => {
      const dto = {
        account: 'admin',
        password: 'wrongpassword',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        account: 'admin',
        password: '$2b$10$hashedpassword',
        isDisable: false,
      });

      const bcrypt = jest.requireMock('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(HttpException);
      await expect(service.login(dto)).rejects.toThrow('用户名或密码错误');
    });

    it('用户被禁用时应该无法登录', async () => {
      const dto = {
        account: 'disabled',
        password: '123456',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(HttpException);
    });
  });

  describe('createToken', () => {
    it('应该成功创建 token', async () => {
      const userData = { id: 1, account: 'admin' };
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.createToken(userData);

      expect(result).toBe('mock-token');
    });
  });

  describe('validateToken', () => {
    it('token 不存在时应该抛出异常', async () => {
      const mockRequest = {
        cookies: {},
        session: {},
        url: '/api/user/findUsers',
      };

      await expect(service.validateToken(mockRequest)).rejects.toThrow(HttpException);
      await expect(service.validateToken(mockRequest)).rejects.toThrow('没有授权，请先登录');
    });

    it('token 无效时应该抛出异常', async () => {
      const mockRequest = {
        cookies: { token: 'invalid-token' },
        session: {},
        url: '/api/user/findUsers',
      };

      mockJwtService.decode.mockReturnValue(null);

      await expect(service.validateToken(mockRequest)).rejects.toThrow(HttpException);
      await expect(service.validateToken(mockRequest)).rejects.toThrow('无效的令牌，请重新登录');
    });

    it('token 已过期时应该抛出异常', async () => {
      const mockRequest = {
        cookies: { token: 'expired-token' },
        session: {},
        url: '/api/user/findUsers',
      };

      mockJwtService.decode.mockReturnValue({
        id: 1,
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      await expect(service.validateToken(mockRequest)).rejects.toThrow(HttpException);
      await expect(service.validateToken(mockRequest)).rejects.toThrow('令牌已过期，请重新登录');
    });
  });

  describe('weappLogin', () => {
    it('应该成功微信登录（已存在用户）', async () => {
      const dto = {
        code: 'test-code',
        openid: 'test-openid',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        wxOpenid: 'test-openid',
        isDisable: false,
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.weappLogin(dto);

      expect(result.id).toBe(1);
      expect(result.token).toBe('mock-token');
    });

    it('应该成功微信登录（新用户）', async () => {
      const dto = {
        code: 'test-code',
        openid: 'new-openid',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: 2,
        name: '普通用户',
      });
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        wxOpenid: 'new-openid',
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.weappLogin(dto);

      expect(result.token).toBe('mock-token');
    });

    it('默认角色不存在时应该抛出异常', async () => {
      const dto = {
        code: 'test-code',
        openid: 'new-openid',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.weappLogin(dto)).rejects.toThrow(HttpException);
      await expect(service.weappLogin(dto)).rejects.toThrow('默认角色不存在');
    });
  });

  describe('getLoginState', () => {
    it('应该返回登录状态', async () => {
      const dto = { unique: 'test-unique' };
      const mockLoginData = JSON.stringify({ id: 1, token: 'mock-token' });

      mockRedis.hget.mockResolvedValue(mockLoginData);

      const result = await service.getLoginState(dto);

      expect(result).toEqual({ id: 1, token: 'mock-token' });
    });

    it('未找到登录状态时应该抛出异常', async () => {
      const dto = { unique: 'nonexistent-unique' };

      mockRedis.hget.mockResolvedValue(null);

      await expect(service.getLoginState(dto)).rejects.toThrow(HttpException);
    });
  });

  describe('invalidateUserPermissionCache', () => {
    it('应该成功清除用户权限缓存', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.invalidateUserPermissionCache(1);

      expect(mockRedis.del).toHaveBeenCalledWith('user:permission:1');
    });
  });

  describe('边缘案例测试', () => {
    describe('login 边缘案例', () => {
      it('应该处理超长用户名', async () => {
        const longAccount = 'a'.repeat(100);
        const dto = {
          account: longAccount,
          password: '123456',
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理超长密码', async () => {
        const longPassword = 'p'.repeat(100);
        const dto = {
          account: 'admin',
          password: longPassword,
        };

        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          password: '$2b$10$hashedpassword',
          isDisable: false,
        });

        const bcrypt = jest.requireMock('bcrypt');
        bcrypt.compare.mockResolvedValue(false);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理包含特殊字符的用户名', async () => {
        const dto = {
          account: "admin'; DROP TABLE users;--",
          password: '123456',
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理空用户名', async () => {
        const dto = {
          account: '',
          password: '123456',
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理空密码', async () => {
        const dto = {
          account: 'admin',
          password: '',
        };

        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          password: '$2b$10$hashedpassword',
          isDisable: false,
        });

        const bcrypt = jest.requireMock('bcrypt');
        bcrypt.compare.mockResolvedValue(false);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理中文用户名', async () => {
        const dto = {
          account: '测试用户',
          password: '123456',
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.login(dto)).rejects.toThrow(HttpException);
      });
    });

    describe('createToken 边缘案例', () => {
      it('应该处理包含特殊字符的用户数据', async () => {
        const userData = { id: 1, account: "user<script>alert('xss')</script>" };
        mockJwtService.sign.mockReturnValue('mock-token');

        const result = await service.createToken(userData);

        expect(result).toBe('mock-token');
      });

      it('应该处理大数值用户ID', async () => {
        const userData = { id: Number.MAX_SAFE_INTEGER, account: 'admin' };
        mockJwtService.sign.mockReturnValue('mock-token');

        const result = await service.createToken(userData);

        expect(result).toBe('mock-token');
      });
    });

    describe('validateToken 边缘案例', () => {
      it('应该处理格式错误的 token', async () => {
        const mockRequest = {
          cookies: { token: 'not.a.valid.jwt' },
          session: {},
          url: '/api/user/findUsers',
        };

        mockJwtService.decode.mockReturnValue({});

        await expect(service.validateToken(mockRequest)).rejects.toThrow(HttpException);
      });

      it('应该处理 session 中的 token', async () => {
        const mockRequest = {
          cookies: { token: 'session-token' },
          session: { user: 'session-token' },
          url: '/api/user/findUsers',
        };

        mockJwtService.decode.mockReturnValue({
          id: 1,
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        mockRedis.get.mockResolvedValue(null);
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          isDisable: false,
          role: {
            id: 1,
            name: '管理员',
            apiRoutes: JSON.stringify(['/api/user/findUsers']),
            isDisable: false,
          },
        });
        mockRedis.setex.mockResolvedValue('OK');

        const result = await service.validateToken(mockRequest);

        expect(result).toBe(true);
      });

      it('应该处理空 token', async () => {
        const mockRequest = {
          cookies: { token: '' },
          session: {},
          url: '/api/user/findUsers',
        };

        await expect(service.validateToken(mockRequest)).rejects.toThrow(HttpException);
      });

      it('应该处理 token 即将过期（边界值）', async () => {
        const mockRequest = {
          cookies: { token: 'expiring-soon-token' },
          session: { user: 'expiring-soon-token' },
          url: '/api/user/findUsers',
        };

        mockJwtService.decode.mockReturnValue({
          id: 1,
          exp: Math.floor(Date.now() / 1000) + 1,
        });
        mockRedis.get.mockResolvedValue(null);
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          isDisable: false,
          role: {
            id: 1,
            name: '管理员',
            apiRoutes: JSON.stringify(['/api/user/findUsers']),
            isDisable: false,
          },
        });
        mockRedis.setex.mockResolvedValue('OK');

        const result = await service.validateToken(mockRequest);

        expect(result).toBe(true);
      });
    });

    describe('weappLogin 边缘案例', () => {
      it('应该处理无效的 code', async () => {
        const dto = {
          code: '',
          openid: 'test-openid',
        };

        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          wxOpenid: 'test-openid',
          isDisable: false,
        });
        mockJwtService.sign.mockReturnValue('mock-token');

        const result = await service.weappLogin(dto);

        expect(result.token).toBe('mock-token');
      });

      it('应该处理超长 openid', async () => {
        const longOpenid = 'o'.repeat(100);
        const dto = {
          code: 'test-code',
          openid: longOpenid,
        };

        mockUserRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.findOne.mockResolvedValue({
          id: 2,
          name: '普通用户',
        });
        mockUserRepository.save.mockResolvedValue({
          id: 1,
          wxOpenid: longOpenid,
        });
        mockJwtService.sign.mockReturnValue('mock-token');

        const result = await service.weappLogin(dto);

        expect(result.token).toBe('mock-token');
      });

      it('应该处理包含特殊字符的 openid', async () => {
        const dto = {
          code: 'test-code',
          openid: "openid<script>alert('xss')</script>",
        };

        mockUserRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.findOne.mockResolvedValue({
          id: 2,
          name: '普通用户',
        });
        mockUserRepository.save.mockResolvedValue({
          id: 1,
          wxOpenid: dto.openid,
        });
        mockJwtService.sign.mockReturnValue('mock-token');

        const result = await service.weappLogin(dto);

        expect(result.token).toBe('mock-token');
      });

      it('应该处理默认角色不存在的情况', async () => {
        const dto = {
          code: 'test-code',
          openid: 'new-openid',
        };

        mockUserRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.findOne.mockResolvedValue(null);

        await expect(service.weappLogin(dto)).rejects.toThrow(HttpException);
        await expect(service.weappLogin(dto)).rejects.toThrow('默认角色不存在');
      });
    });

    describe('getLoginState 边缘案例', () => {
      it('应该处理超长 unique 标识', async () => {
        const longUnique = 'u'.repeat(100);
        const dto = { unique: longUnique };

        mockRedis.hget.mockResolvedValue(null);

        await expect(service.getLoginState(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理包含特殊字符的 unique', async () => {
        const dto = { unique: "unique<script>alert('xss')</script>" };

        mockRedis.hget.mockResolvedValue(null);

        await expect(service.getLoginState(dto)).rejects.toThrow(HttpException);
      });

      it('应该处理无效的 JSON 数据', async () => {
        const dto = { unique: 'test-unique' };

        mockRedis.hget.mockResolvedValue('invalid-json-data');

        await expect(service.getLoginState(dto)).rejects.toThrow();
      });
    });

    describe('invalidateUserPermissionCache 边缘案例', () => {
      it('应该处理无效的用户ID', async () => {
        mockRedis.del.mockResolvedValue(0);

        await service.invalidateUserPermissionCache(-1);

        expect(mockRedis.del).toHaveBeenCalledWith('user:permission:-1');
      });

      it('应该处理零值用户ID', async () => {
        mockRedis.del.mockResolvedValue(0);

        await service.invalidateUserPermissionCache(0);

        expect(mockRedis.del).toHaveBeenCalledWith('user:permission:0');
      });

      it('应该处理大数值用户ID', async () => {
        mockRedis.del.mockResolvedValue(1);

        await service.invalidateUserPermissionCache(Number.MAX_SAFE_INTEGER);

        expect(mockRedis.del).toHaveBeenCalledWith(`user:permission:${Number.MAX_SAFE_INTEGER}`);
      });

      it('应该处理缓存不存在的情况', async () => {
        mockRedis.del.mockResolvedValue(0);

        await service.invalidateUserPermissionCache(999);

        expect(mockRedis.del).toHaveBeenCalled();
      });
    });
  });
});
