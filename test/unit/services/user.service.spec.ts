import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import RoleEntity from '@/modules/entities/role';
import UserEntity from '@/modules/entities/user';
import UserService from '@/modules/services/user';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRoleRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    it('应该成功添加用户', async () => {
      const dto = {
        account: 'testuser',
        password: '123456',
        phone: '13800138000',
        email: 'test@example.com',
        roleId: 1,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOneBy.mockResolvedValue({ id: 1, name: 'user' });
      mockUserRepository.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.addUser(dto);
      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { account: dto.account },
      });
    });

    it('用户名重复时应该抛出异常', async () => {
      const dto = {
        account: 'existinguser',
        password: '123456',
        roleId: 1,
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1, account: dto.account });

      await expect(service.addUser(dto)).rejects.toThrow('用户名不能重复');
    });
  });

  describe('findUsers', () => {
    it('应该返回分页用户列表', async () => {
      const mockUsers = [
        {
          id: 1,
          account: 'user1',
          phone: '13800138001',
          email: 'user1@example.com',
          isDisable: false,
          createTime: new Date('2024-01-01'),
          updateTime: new Date('2024-01-01'),
          lastLoginTime: null,
          role: { id: 1, name: '管理员' },
        },
        {
          id: 2,
          account: 'user2',
          phone: '13800138002',
          email: 'user2@example.com',
          isDisable: false,
          createTime: new Date('2024-01-01'),
          updateTime: new Date('2024-01-01'),
          lastLoginTime: null,
          role: { id: 2, name: '普通用户' },
        },
      ];

      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findUsers({ page: 1, pageSize: 20 });

      expect(result.list.length).toBe(2);
      expect(result.list[0].account).toBe('user1');
      expect(result.total).toBe(2);
    });
  });
});
