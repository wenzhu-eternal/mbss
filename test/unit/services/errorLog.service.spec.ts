import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import ErrorLogEntity from '@/modules/entities/errorLog';
import ErrorWhitelistEntity from '@/modules/entities/errorWhitelist';
import ErrorLogService from '@/modules/services/errorLog';

describe('ErrorLogService', () => {
  let service: ErrorLogService;

  const mockErrorLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockWhitelistRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLogService,
        {
          provide: getRepositoryToken(ErrorLogEntity),
          useValue: mockErrorLogRepository,
        },
        {
          provide: getRepositoryToken(ErrorWhitelistEntity),
          useValue: mockWhitelistRepository,
        },
      ],
    }).compile();

    service = module.get<ErrorLogService>(ErrorLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reportError', () => {
    it('应该成功上报错误', async () => {
      const dto = {
        message: '测试错误',
        stack: 'Error stack trace',
        url: '/api/test',
        source: 'frontend' as const,
        errorType: 'TypeError',
      };

      mockWhitelistRepository.find.mockResolvedValue([]);
      mockErrorLogRepository.create.mockReturnValue(dto);
      mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.reportError(dto, '127.0.0.1');

      expect(result).toBe(true);
    });

    it('白名单匹配时应该返回 false', async () => {
      const dto = {
        message: 'Script error',
        stack: '',
        url: '/api/test',
        source: 'frontend' as const,
        errorType: 'Error',
      };

      mockWhitelistRepository.find.mockResolvedValue([
        {
          id: 1,
          matchType: 'message',
          pattern: 'Script error',
          isEnabled: true,
        },
      ]);

      const result = await service.reportError(dto);

      expect(result).toBe(false);
    });
  });

  describe('getErrorLogList', () => {
    it('应该返回分页错误日志列表', async () => {
      const mockErrorLogs = [
        {
          id: 1,
          message: '错误1',
          stack: 'stack trace',
          url: '/api/test',
          source: 'frontend',
          errorType: 'TypeError',
          isResolved: false,
          createTime: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockErrorLogs, 1]),
      };

      mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getErrorLogList({ page: 1, pageSize: 20 });

      expect(result.list).toEqual(mockErrorLogs);
      expect(result.total).toBe(1);
    });

    it('应该正确过滤已处理的错误', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getErrorLogList({ page: 1, pageSize: 20, isResolved: '1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('应该正确处理关键词搜索', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getErrorLogList({ page: 1, pageSize: 20, keyword: '测试' });

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('getErrorLogById', () => {
    it('应该返回错误日志详情', async () => {
      const mockErrorLog = {
        id: 1,
        message: '测试错误',
        stack: 'stack trace',
        url: '/api/test',
        source: 'frontend',
        errorType: 'TypeError',
        isResolved: false,
        createTime: new Date(),
      };

      mockErrorLogRepository.findOne.mockResolvedValue(mockErrorLog);

      const result = await service.getErrorLogById(1);

      expect(result).toEqual(mockErrorLog);
    });

    it('ID 无效时应该抛出异常', async () => {
      await expect(service.getErrorLogById(0)).rejects.toThrow(HttpException);
      await expect(service.getErrorLogById(0)).rejects.toThrow('无效的错误日志ID');
    });

    it('错误日志不存在时应该抛出异常', async () => {
      mockErrorLogRepository.findOne.mockResolvedValue(null);

      await expect(service.getErrorLogById(999)).rejects.toThrow(HttpException);
      await expect(service.getErrorLogById(999)).rejects.toThrow('错误日志不存在');
    });
  });

  describe('resolveError', () => {
    it('应该成功标记错误为已处理', async () => {
      mockErrorLogRepository.findOne.mockResolvedValue({
        id: 1,
        isResolved: false,
      });
      mockErrorLogRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.resolveError({ id: 1 }, 1);

      expect(result).toBe(true);
    });

    it('ID 无效时应该抛出异常', async () => {
      await expect(service.resolveError({ id: 0 }, 1)).rejects.toThrow(HttpException);
      await expect(service.resolveError({ id: 0 }, 1)).rejects.toThrow('无效的错误日志ID');
    });

    it('错误日志不存在时应该抛出异常', async () => {
      mockErrorLogRepository.findOne.mockResolvedValue(null);

      await expect(service.resolveError({ id: 999 }, 1)).rejects.toThrow(HttpException);
      await expect(service.resolveError({ id: 999 }, 1)).rejects.toThrow('错误日志不存在');
    });

    it('错误已处理时应该抛出异常', async () => {
      mockErrorLogRepository.findOne.mockResolvedValue({
        id: 1,
        isResolved: true,
      });

      await expect(service.resolveError({ id: 1 }, 1)).rejects.toThrow(HttpException);
      await expect(service.resolveError({ id: 1 }, 1)).rejects.toThrow('该错误已处理');
    });
  });

  describe('getErrorStats', () => {
    it('应该返回错误统计信息', async () => {
      mockErrorLogRepository.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { source: 'web', count: '7' },
          { source: 'miniapp', count: '3' },
        ]),
      };

      mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getErrorStats();

      expect(result.total).toBe(10);
      expect(result.unresolved).toBe(3);
    });
  });

  describe('getWhitelist', () => {
    it('应该返回白名单列表', async () => {
      const mockWhitelist = [
        {
          id: 1,
          name: '忽略 Script error',
          matchType: 'message',
          pattern: 'Script error',
          isEnabled: true,
          createTime: new Date(),
        },
      ];

      mockWhitelistRepository.find.mockResolvedValue(mockWhitelist);

      const result = await service.getWhitelist();

      expect(result).toEqual(mockWhitelist);
    });
  });

  describe('addWhitelist', () => {
    it('应该成功添加白名单规则', async () => {
      const dto = {
        name: '忽略 Script error',
        matchType: 'message' as const,
        pattern: 'Script error',
      };

      mockWhitelistRepository.create.mockReturnValue(dto);
      mockWhitelistRepository.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.addWhitelist(dto);

      expect(result.id).toBe(1);
    });

    it('正则表达式格式无效时应该抛出异常', async () => {
      const dto = {
        name: '无效规则',
        matchType: 'message' as const,
        pattern: '[invalid',
      };

      await expect(service.addWhitelist(dto)).rejects.toThrow(HttpException);
      await expect(service.addWhitelist(dto)).rejects.toThrow('正则表达式格式无效');
    });
  });

  describe('updateWhitelist', () => {
    it('应该成功更新白名单规则', async () => {
      const dto = {
        id: 1,
        name: '更新后的规则',
        matchType: 'message' as const,
        pattern: 'Updated pattern',
        isEnabled: true,
      };

      mockWhitelistRepository.findOne.mockResolvedValue({ id: 1 });
      mockWhitelistRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateWhitelist(dto);

      expect(result).toBe(true);
    });

    it('白名单规则不存在时应该抛出异常', async () => {
      const dto = {
        id: 999,
        name: '规则',
        matchType: 'message' as const,
        pattern: 'pattern',
      };

      mockWhitelistRepository.findOne.mockResolvedValue(null);

      await expect(service.updateWhitelist(dto)).rejects.toThrow(HttpException);
      await expect(service.updateWhitelist(dto)).rejects.toThrow('白名单规则不存在');
    });

    it('正则表达式格式无效时应该抛出异常', async () => {
      const dto = {
        id: 1,
        name: '无效规则',
        matchType: 'message' as const,
        pattern: '[invalid',
      };

      mockWhitelistRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.updateWhitelist(dto)).rejects.toThrow(HttpException);
      await expect(service.updateWhitelist(dto)).rejects.toThrow('正则表达式格式无效');
    });
  });

  describe('deleteWhitelist', () => {
    it('应该成功删除白名单规则', async () => {
      mockWhitelistRepository.findOne.mockResolvedValue({ id: 1 });
      mockWhitelistRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteWhitelist({ id: 1 });

      expect(result).toBe(true);
    });

    it('白名单规则不存在时应该抛出异常', async () => {
      mockWhitelistRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteWhitelist({ id: 999 })).rejects.toThrow(HttpException);
      await expect(service.deleteWhitelist({ id: 999 })).rejects.toThrow('白名单规则不存在');
    });
  });

  describe('边缘案例测试', () => {
    describe('reportError 边缘案例', () => {
      it('应该处理超长错误消息', async () => {
        const longMessage = 'Error: '.repeat(1000);
        const dto = {
          message: longMessage,
          stack: 'stack trace',
          url: '/api/test',
          source: 'frontend' as const,
          errorType: 'Error',
        };

        mockWhitelistRepository.find.mockResolvedValue([]);
        mockErrorLogRepository.create.mockReturnValue(dto);
        mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.reportError(dto);

        expect(result).toBe(true);
      });

      it('应该处理空堆栈信息', async () => {
        const dto = {
          message: '测试错误',
          stack: '',
          url: '/api/test',
          source: 'frontend' as const,
          errorType: 'TypeError',
        };

        mockWhitelistRepository.find.mockResolvedValue([]);
        mockErrorLogRepository.create.mockReturnValue(dto);
        mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.reportError(dto);

        expect(result).toBe(true);
      });

      it('应该处理不同来源的错误', async () => {
        const sources: Array<'frontend' | 'backend' | 'taro'> = ['frontend', 'backend', 'taro'];

        for (const source of sources) {
          const dto = {
            message: '测试错误',
            source,
            errorType: 'Error',
          };

          mockWhitelistRepository.find.mockResolvedValue([]);
          mockErrorLogRepository.create.mockReturnValue(dto);
          mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

          const result = await service.reportError(dto);

          expect(result).toBe(true);
        }
      });

      it('应该处理包含特殊字符的错误消息', async () => {
        const dto = {
          message: "Error: <script>alert('xss')</script>",
          stack: 'stack trace',
          url: '/api/test?param=<script>',
          source: 'frontend' as const,
          errorType: 'TypeError',
        };

        mockWhitelistRepository.find.mockResolvedValue([]);
        mockErrorLogRepository.create.mockReturnValue(dto);
        mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.reportError(dto);

        expect(result).toBe(true);
      });

      it('应该处理多条白名单匹配', async () => {
        const dto = {
          message: 'Script error',
          stack: '',
          url: '/api/test',
          source: 'frontend' as const,
          errorType: 'Error',
        };

        mockWhitelistRepository.find.mockResolvedValue([
          {
            id: 1,
            matchType: 'message',
            pattern: 'NonMatching',
            isEnabled: true,
          },
          {
            id: 2,
            matchType: 'message',
            pattern: 'Script error',
            isEnabled: true,
          },
        ]);

        const result = await service.reportError(dto);

        expect(result).toBe(false);
      });

      it('应该处理禁用的白名单规则', async () => {
        const dto = {
          message: 'Script error',
          stack: '',
          url: '/api/test',
          source: 'frontend' as const,
          errorType: 'Error',
        };

        mockWhitelistRepository.find.mockResolvedValue([
          {
            id: 1,
            matchType: 'message',
            pattern: 'Script error',
            isEnabled: false,
          },
        ]);

        mockErrorLogRepository.create.mockReturnValue(dto);
        mockErrorLogRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.reportError(dto);

        expect(result).toBe(true);
      });

      it('应该处理正则表达式白名单匹配', async () => {
        const dto = {
          message: 'Network error: timeout',
          stack: '',
          url: '/api/test',
          source: 'frontend' as const,
          errorType: 'NetworkError',
        };

        mockWhitelistRepository.find.mockResolvedValue([
          {
            id: 1,
            matchType: 'message',
            pattern: 'Network error: .*',
            isEnabled: true,
          },
        ]);

        const result = await service.reportError(dto);

        expect(result).toBe(false);
      });
    });

    describe('getErrorLogList 边缘案例', () => {
      it('应该处理超大页码', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 100]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getErrorLogList({ page: 1000, pageSize: 20 });

        expect(result.list).toEqual([]);
        expect(result.page).toBe(1000);
      });

      it('应该处理超大每页数量', async () => {
        const manyErrors = Array.from({ length: 500 }, (_, i) => ({
          id: i + 1,
          message: `错误${i + 1}`,
        }));

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([manyErrors, 500]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getErrorLogList({ page: 1, pageSize: 500 });

        expect(result.list.length).toBe(500);
      });

      it('应该处理时间范围过滤', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        await service.getErrorLogList({
          page: 1,
          pageSize: 20,
          startTime: '2024-01-01',
          endTime: '2024-01-31',
        });

        expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      });

      it('应该处理错误类型过滤', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        await service.getErrorLogList({
          page: 1,
          pageSize: 20,
          errorType: 'TypeError',
        });

        expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      });

      it('应该处理来源过滤', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        await service.getErrorLogList({
          page: 1,
          pageSize: 20,
          source: 'frontend',
        });

        expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      });
    });

    describe('getErrorLogById 边缘案例', () => {
      it('应该处理负数ID', async () => {
        await expect(service.getErrorLogById(-1)).rejects.toThrow(HttpException);
      });

      it('应该处理小数ID', async () => {
        mockErrorLogRepository.findOne.mockResolvedValue(null);

        await expect(service.getErrorLogById(1.5)).rejects.toThrow(HttpException);
      });
    });

    describe('resolveError 边缘案例', () => {
      it('应该处理负数ID', async () => {
        await expect(service.resolveError({ id: -1 }, 1)).rejects.toThrow(HttpException);
      });

      it('应该处理重复标记已处理', async () => {
        mockErrorLogRepository.findOne.mockResolvedValue({
          id: 1,
          isResolved: true,
        });

        await expect(service.resolveError({ id: 1 }, 1)).rejects.toThrow(HttpException);
      });
    });

    describe('getErrorStats 边缘案例', () => {
      it('应该处理零错误统计', async () => {
        mockErrorLogRepository.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getErrorStats();

        expect(result.total).toBe(0);
        expect(result.unresolved).toBe(0);
      });

      it('应该处理大量错误统计', async () => {
        mockErrorLogRepository.count.mockResolvedValueOnce(10000).mockResolvedValueOnce(5000);

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { source: 'frontend', count: '5000' },
            { source: 'backend', count: '3000' },
            { source: 'taro', count: '2000' },
          ]),
        };

        mockErrorLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getErrorStats();

        expect(result.total).toBe(10000);
        expect(result.unresolved).toBe(5000);
      });
    });

    describe('addWhitelist 边缘案例', () => {
      it('应该处理超长规则名称', async () => {
        const longName = '规则名称'.repeat(100);
        const dto = {
          name: longName,
          matchType: 'message' as const,
          pattern: 'test',
        };

        mockWhitelistRepository.create.mockReturnValue(dto);
        mockWhitelistRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.addWhitelist(dto);

        expect(result.id).toBe(1);
      });

      it('应该处理复杂的正则表达式', async () => {
        const dto = {
          name: '复杂正则',
          matchType: 'message' as const,
          pattern: '^Error: \\w+ at \\d+:\\d+$',
        };

        mockWhitelistRepository.create.mockReturnValue(dto);
        mockWhitelistRepository.save.mockResolvedValue({ id: 1, ...dto });

        const result = await service.addWhitelist(dto);

        expect(result.id).toBe(1);
      });

      it('应该处理不同匹配类型', async () => {
        const matchTypes: Array<'message' | 'url' | 'errorType' | 'file'> = [
          'message',
          'url',
          'errorType',
          'file',
        ];

        for (const matchType of matchTypes) {
          const dto = {
            name: `${matchType}规则`,
            matchType,
            pattern: 'test',
          };

          mockWhitelistRepository.create.mockReturnValue(dto);
          mockWhitelistRepository.save.mockResolvedValue({ id: 1, ...dto });

          const result = await service.addWhitelist(dto);

          expect(result.id).toBe(1);
        }
      });
    });

    describe('updateWhitelist 边缘案例', () => {
      it('应该处理更新为相同数据', async () => {
        const dto = {
          id: 1,
          name: '原规则名',
          matchType: 'message' as const,
          pattern: 'test',
        };

        mockWhitelistRepository.findOne.mockResolvedValue({
          id: 1,
          name: '原规则名',
          matchType: 'message',
          pattern: 'test',
        });
        mockWhitelistRepository.update.mockResolvedValue({ affected: 1 });

        const result = await service.updateWhitelist(dto);

        expect(result).toBe(true);
      });

      it('应该处理无效的白名单ID', async () => {
        const dto = {
          id: -1,
          name: '测试',
          matchType: 'message' as const,
          pattern: 'test',
        };

        mockWhitelistRepository.findOne.mockResolvedValue(null);

        await expect(service.updateWhitelist(dto)).rejects.toThrow(HttpException);
      });
    });

    describe('deleteWhitelist 边缘案例', () => {
      it('应该处理无效的白名单ID', async () => {
        mockWhitelistRepository.findOne.mockResolvedValue(null);

        await expect(service.deleteWhitelist({ id: -1 })).rejects.toThrow(HttpException);
      });

      it('应该处理重复删除', async () => {
        mockWhitelistRepository.findOne.mockResolvedValueOnce({ id: 1 });
        mockWhitelistRepository.delete.mockResolvedValueOnce({ affected: 1 });

        await service.deleteWhitelist({ id: 1 });

        mockWhitelistRepository.findOne.mockResolvedValueOnce(null);

        await expect(service.deleteWhitelist({ id: 1 })).rejects.toThrow(HttpException);
      });
    });
  });
});
