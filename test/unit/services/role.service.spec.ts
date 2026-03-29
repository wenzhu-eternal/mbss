import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import RoleEntity from '@/modules/entities/role';
import RoleService from '@/modules/services/role';

describe('RoleService', () => {
  let service: RoleService;

  const mockRoleRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addRole', () => {
    it('应该成功添加角色', async () => {
      const dto = {
        name: '测试角色',
        apiRoutes: ['/api/user/findUsers', '/api/user/addUser'],
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.save.mockResolvedValue({
        id: 1,
        name: dto.name,
        apiRoutes: JSON.stringify(dto.apiRoutes),
        createTime: new Date(),
      });

      const result = await service.addRole(dto);

      expect(result.name).toBe(dto.name);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('角色名重复时应该抛出异常', async () => {
      const dto = {
        name: '已存在角色',
        apiRoutes: ['/api/user/findUsers'],
      };

      mockRoleRepository.findOne.mockResolvedValue({
        id: 1,
        name: dto.name,
      });

      await expect(service.addRole(dto)).rejects.toThrow(HttpException);
      await expect(service.addRole(dto)).rejects.toThrow('权限名不能重复');
    });
  });

  describe('findRoles', () => {
    it('应该返回分页角色列表', async () => {
      const mockRoles = [
        { id: 1, name: '管理员', apiRoutes: '[]', isDisable: false },
        { id: 2, name: '普通用户', apiRoutes: '[]', isDisable: false },
      ];

      mockRoleRepository.findAndCount.mockResolvedValue([mockRoles, 2]);

      const result = await service.findRoles({ page: 1, pageSize: 20 });

      expect(result.list).toEqual(mockRoles);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('应该正确处理空列表', async () => {
      mockRoleRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findRoles({ page: 1, pageSize: 20 });

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('应该正确处理分页参数', async () => {
      const mockRoles = [{ id: 3, name: '角色3' }];

      mockRoleRepository.findAndCount.mockResolvedValue([mockRoles, 10]);

      const result = await service.findRoles({ page: 2, pageSize: 5 });

      expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
    });
  });

  describe('updateRole', () => {
    it('应该成功更新角色', async () => {
      const dto = {
        id: 1,
        name: '更新后的角色',
        apiRoutes: ['/api/user/findUsers'],
      };

      mockRoleRepository.findOneBy.mockResolvedValue({
        id: 1,
        name: '原角色名',
      });
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateRole(dto);

      expect(result).toBe(true);
      expect(mockRoleRepository.update).toHaveBeenCalledWith(
        { id: dto.id },
        expect.objectContaining({
          name: dto.name,
          apiRoutes: JSON.stringify(dto.apiRoutes),
        }),
      );
    });

    it('角色不存在时应该抛出异常', async () => {
      const dto = {
        id: 999,
        name: '更新后的角色',
        apiRoutes: ['/api/user/findUsers'],
      };

      mockRoleRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateRole(dto)).rejects.toThrow(HttpException);
      await expect(service.updateRole(dto)).rejects.toThrow('无此角色，请确认');
    });

    it('角色名与其他角色重复时应该抛出异常', async () => {
      const dto = {
        id: 1,
        name: '已存在的角色名',
        apiRoutes: ['/api/user/findUsers'],
      };

      mockRoleRepository.findOneBy.mockResolvedValue({
        id: 1,
        name: '原角色名',
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 2,
        name: dto.name,
      });

      await expect(service.updateRole(dto)).rejects.toThrow(HttpException);
      await expect(service.updateRole(dto)).rejects.toThrow('角色名不能重复');
    });

    it('更新相同名称的角色应该成功', async () => {
      const dto = {
        id: 1,
        name: '原角色名',
        apiRoutes: ['/api/user/findUsers'],
      };

      mockRoleRepository.findOneBy.mockResolvedValue({
        id: 1,
        name: '原角色名',
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 1,
        name: '原角色名',
      });
      mockRoleRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateRole(dto);

      expect(result).toBe(true);
    });
  });

  describe('toggleRoleStatus', () => {
    it('应该成功切换角色状态（启用到禁用）', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 1,
        name: '测试角色',
        isDisable: false,
      });
      mockRoleRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleRoleStatus({ id: 1 });

      expect(result).toBe(true);
      expect(mockRoleRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        expect.objectContaining({
          isDisable: true,
        }),
      );
    });

    it('应该成功切换角色状态（禁用到启用）', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 1,
        name: '测试角色',
        isDisable: true,
      });
      mockRoleRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleRoleStatus({ id: 1 });

      expect(result).toBe(true);
      expect(mockRoleRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        expect.objectContaining({
          isDisable: false,
        }),
      );
    });

    it('角色不存在时应该抛出异常', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleRoleStatus({ id: 999 })).rejects.toThrow(HttpException);
      await expect(service.toggleRoleStatus({ id: 999 })).rejects.toThrow('无此权限，请确认');
    });
  });

  describe('getApiRoutes', () => {
    it('应该返回API路由列表', async () => {
      const result = await service.getApiRoutes();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('边缘案例测试', () => {
    describe('addRole 边缘案例', () => {
      it('应该处理空API路由数组', async () => {
        const dto = {
          name: '无权限角色',
          apiRoutes: [],
        };

        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.save.mockResolvedValue({
          id: 1,
          name: dto.name,
          apiRoutes: '[]',
          createTime: new Date(),
        });

        const result = await service.addRole(dto);

        expect(result.name).toBe(dto.name);
      });

      it('应该处理超长角色名', async () => {
        const longName = 'A'.repeat(100);
        const dto = {
          name: longName,
          apiRoutes: ['/api/test'],
        };

        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.save.mockResolvedValue({
          id: 1,
          name: longName,
          apiRoutes: JSON.stringify(dto.apiRoutes),
          createTime: new Date(),
        });

        const result = await service.addRole(dto);

        expect(result.name).toBe(longName);
      });

      it('应该处理包含特殊字符的角色名', async () => {
        const dto = {
          name: '测试角色-@#$%',
          apiRoutes: ['/api/test'],
        };

        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.save.mockResolvedValue({
          id: 1,
          name: dto.name,
          apiRoutes: JSON.stringify(dto.apiRoutes),
          createTime: new Date(),
        });

        const result = await service.addRole(dto);

        expect(result.name).toBe(dto.name);
      });

      it('应该处理大量API路由', async () => {
        const manyRoutes = Array.from({ length: 100 }, (_, i) => `/api/route${i}`);
        const dto = {
          name: '大量权限角色',
          apiRoutes: manyRoutes,
        };

        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.save.mockResolvedValue({
          id: 1,
          name: dto.name,
          apiRoutes: JSON.stringify(dto.apiRoutes),
          createTime: new Date(),
        });

        const result = await service.addRole(dto);

        expect(result.name).toBe(dto.name);
      });

      it('应该处理中文角色名', async () => {
        const dto = {
          name: '中文角色名称测试',
          apiRoutes: ['/api/test'],
        };

        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.save.mockResolvedValue({
          id: 1,
          name: dto.name,
          apiRoutes: JSON.stringify(dto.apiRoutes),
          createTime: new Date(),
        });

        const result = await service.addRole(dto);

        expect(result.name).toBe(dto.name);
      });
    });

    describe('findRoles 边缘案例', () => {
      it('应该处理超大页码', async () => {
        mockRoleRepository.findAndCount.mockResolvedValue([[], 10]);

        const result = await service.findRoles({ page: 1000, pageSize: 20 });

        expect(result.list).toEqual([]);
        expect(result.page).toBe(1000);
      });

      it('应该处理超大每页数量', async () => {
        const manyRoles = Array.from({ length: 500 }, (_, i) => ({
          id: i + 1,
          name: `角色${i + 1}`,
        }));
        mockRoleRepository.findAndCount.mockResolvedValue([manyRoles, 500]);

        const result = await service.findRoles({ page: 1, pageSize: 500 });

        expect(result.list.length).toBe(500);
      });

      it('应该处理第0页', async () => {
        mockRoleRepository.findAndCount.mockResolvedValue([[], 0]);

        await service.findRoles({ page: 0, pageSize: 20 });

        expect(mockRoleRepository.findAndCount).toHaveBeenCalled();
      });

      it('应该处理每页0条', async () => {
        mockRoleRepository.findAndCount.mockResolvedValue([[], 0]);

        await service.findRoles({ page: 1, pageSize: 0 });

        expect(mockRoleRepository.findAndCount).toHaveBeenCalled();
      });
    });

    describe('updateRole 边缘案例', () => {
      it('应该处理更新为空API路由', async () => {
        const dto = {
          id: 1,
          name: '更新后的角色',
          apiRoutes: [],
        };

        mockRoleRepository.findOneBy.mockResolvedValue({
          id: 1,
          name: '原角色名',
        });
        mockRoleRepository.findOne.mockResolvedValue(null);
        mockRoleRepository.update.mockResolvedValue({ affected: 1 });

        const result = await service.updateRole(dto);

        expect(result).toBe(true);
      });

      it('应该处理无效的角色ID', async () => {
        const dto = {
          id: -1,
          name: '测试',
          apiRoutes: [],
        };

        mockRoleRepository.findOneBy.mockResolvedValue(null);

        await expect(service.updateRole(dto)).rejects.toThrow(HttpException);
      });
    });

    describe('toggleRoleStatus 边缘案例', () => {
      it('应该处理连续切换状态', async () => {
        mockRoleRepository.findOne.mockResolvedValue({
          id: 1,
          name: '测试角色',
          isDisable: false,
        });
        mockRoleRepository.update.mockResolvedValue({ affected: 1 });

        await service.toggleRoleStatus({ id: 1 });

        mockRoleRepository.findOne.mockResolvedValue({
          id: 1,
          name: '测试角色',
          isDisable: true,
        });

        await service.toggleRoleStatus({ id: 1 });

        expect(mockRoleRepository.update).toHaveBeenCalledTimes(2);
      });
    });
  });
});
