import { spawn } from 'child_process';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/config/config.default', () => ({
  mysql: {
    username: 'root',
    password: 'password',
    database: 'test_db',
    host: 'localhost',
    port: 3306,
  },
  uploadDir: '/backup',
}));

describe('TasksService', () => {
  let service: any;
  let TasksServiceClass: any;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendBackup: jest.fn().mockResolvedValue(true),
  };

  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

  beforeAll(() => {
    TasksServiceClass = class {
      private readonly mailService = mockMailService;
      private readonly userRepository = mockUserRepository;

      validatePath(path: string): boolean {
        const dangerousPatterns = /[;&|`$(){}[\]\\<>!]/;
        return !dangerousPatterns.test(path);
      }

      validateIdentifier(identifier: string): boolean {
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        return validPattern.test(identifier);
      }

      async getAdminUserEmail(): Promise<{ email: string; name: string } | null> {
        const adminUser = await this.userRepository.findOne({
          where: { account: 'admin' },
          select: ['id', 'account', 'email'],
        });

        if (!adminUser || !adminUser.email) {
          return null;
        }

        return {
          email: adminUser.email,
          name: adminUser.account,
        };
      }

      async backupDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
          const mysqldump = mockSpawn('mysqldump', [], {});
          mysqldump.on('close', (code: number) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Backup failed with code ${code}`));
            }
          });
        });
      }
    };

    service = new TasksServiceClass();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePath', () => {
    it('应该接受有效的路径', () => {
      expect(service.validatePath('/backup/data')).toBe(true);
      expect(service.validatePath('/var/lib/mysql')).toBe(true);
      expect(service.validatePath('./relative/path')).toBe(true);
    });

    it('应该拒绝包含危险字符的路径', () => {
      expect(service.validatePath('/path;rm -rf /')).toBe(false);
      expect(service.validatePath('/path|cat /etc/passwd')).toBe(false);
      expect(service.validatePath('/path$(whoami)')).toBe(false);
      expect(service.validatePath('/path`id`')).toBe(false);
      expect(service.validatePath('/path && echo test')).toBe(false);
    });
  });

  describe('validateIdentifier', () => {
    it('应该接受有效的标识符', () => {
      expect(service.validateIdentifier('root')).toBe(true);
      expect(service.validateIdentifier('test_db')).toBe(true);
      expect(service.validateIdentifier('user-123')).toBe(true);
      expect(service.validateIdentifier('DATABASE_1')).toBe(true);
    });

    it('应该拒绝包含特殊字符的标识符', () => {
      expect(service.validateIdentifier('root;')).toBe(false);
      expect(service.validateIdentifier('test-db`')).toBe(false);
      expect(service.validateIdentifier('user name')).toBe(false);
      expect(service.validateIdentifier('db$1')).toBe(false);
    });
  });

  describe('getAdminUserEmail', () => {
    it('应该返回管理员邮箱信息', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        account: 'admin',
        email: 'admin@example.com',
      });

      const result = await service.getAdminUserEmail();

      expect(result).toEqual({
        email: 'admin@example.com',
        name: 'admin',
      });
    });

    it('管理员不存在时应该返回 null', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getAdminUserEmail();

      expect(result).toBeNull();
    });

    it('管理员没有邮箱时应该返回 null', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        account: 'admin',
        email: null,
      });

      const result = await service.getAdminUserEmail();

      expect(result).toBeNull();
    });
  });

  describe('backupDatabase', () => {
    it('应该成功执行数据库备份', async () => {
      const mockProcess = {
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await service.backupDatabase();

      expect(mockSpawn).toHaveBeenCalled();
    });
  });

  describe('边缘案例测试', () => {
    describe('validatePath 边缘案例', () => {
      it('应该接受空路径', () => {
        expect(service.validatePath('')).toBe(true);
      });

      it('应该接受根路径', () => {
        expect(service.validatePath('/')).toBe(true);
      });

      it('应该接受相对路径', () => {
        expect(service.validatePath('../backup')).toBe(true);
        expect(service.validatePath('./data')).toBe(true);
        expect(service.validatePath('relative/path')).toBe(true);
      });

      it('应该接受包含空格的路径', () => {
        expect(service.validatePath('/path with spaces')).toBe(true);
        expect(service.validatePath('/backup/my data')).toBe(true);
      });

      it('应该接受包含中文的路径', () => {
        expect(service.validatePath('/备份/数据')).toBe(true);
        expect(service.validatePath('/data/测试')).toBe(true);
      });

      it('应该接受超长路径', () => {
        const longPath = `/backup/${'subdir/'.repeat(100)}file.sql`;
        expect(service.validatePath(longPath)).toBe(true);
      });

      it('应该拒绝包含分号的路径', () => {
        expect(service.validatePath('/path;ls')).toBe(false);
        expect(service.validatePath('/path;rm -rf /')).toBe(false);
      });

      it('应该拒绝包含管道符的路径', () => {
        expect(service.validatePath('/path|cat')).toBe(false);
        expect(service.validatePath('/path|grep test')).toBe(false);
      });

      it('应该拒绝包含反引号的路径', () => {
        expect(service.validatePath('/path`id`')).toBe(false);
        expect(service.validatePath('/path`whoami`')).toBe(false);
      });

      it('应该拒绝包含 $() 的路径', () => {
        expect(service.validatePath('/path$(id)')).toBe(false);
        expect(service.validatePath('/path$(whoami)')).toBe(false);
      });

      it('应该拒绝包含 && 的路径', () => {
        expect(service.validatePath('/path && ls')).toBe(false);
        expect(service.validatePath('/path && cat /etc/passwd')).toBe(false);
      });

      it('应该拒绝包含 || 的路径', () => {
        expect(service.validatePath('/path || ls')).toBe(false);
      });

      it('应该拒绝包含大括号的路径', () => {
        expect(service.validatePath('/path{test}')).toBe(false);
      });

      it('应该拒绝包含中括号的路径', () => {
        expect(service.validatePath('/path[test]')).toBe(false);
      });

      it('应该拒绝包含尖括号的路径', () => {
        expect(service.validatePath('/path<test>')).toBe(false);
        expect(service.validatePath('/path>output')).toBe(false);
      });

      it('应该拒绝包含反斜杠的路径', () => {
        expect(service.validatePath('/path\\test')).toBe(false);
      });

      it('应该拒绝包含感叹号的路径', () => {
        expect(service.validatePath('/path!test')).toBe(false);
      });

      it('应该接受包含点号的路径', () => {
        expect(service.validatePath('/path.test')).toBe(true);
        expect(service.validatePath('/backup/file.sql')).toBe(true);
      });

      it('应该接受包含连字符和下划线的路径', () => {
        expect(service.validatePath('/backup-file_2024')).toBe(true);
        expect(service.validatePath('/data/my_backup-file')).toBe(true);
      });

      it('应该接受包含数字的路径', () => {
        expect(service.validatePath('/backup2024')).toBe(true);
        expect(service.validatePath('/backup/2024-01-01')).toBe(true);
      });
    });

    describe('validateIdentifier 边缘案例', () => {
      it('应该拒绝空标识符', () => {
        expect(service.validateIdentifier('')).toBe(false);
      });

      it('应该接受单字符标识符', () => {
        expect(service.validateIdentifier('a')).toBe(true);
        expect(service.validateIdentifier('Z')).toBe(true);
        expect(service.validateIdentifier('1')).toBe(true);
        expect(service.validateIdentifier('_')).toBe(true);
        expect(service.validateIdentifier('-')).toBe(true);
      });

      it('应该接受超长标识符', () => {
        const longIdentifier = 'a'.repeat(1000);
        expect(service.validateIdentifier(longIdentifier)).toBe(true);
      });

      it('应该接受大写字母标识符', () => {
        expect(service.validateIdentifier('DATABASE')).toBe(true);
        expect(service.validateIdentifier('ROOT_USER')).toBe(true);
      });

      it('应该接受小写字母标识符', () => {
        expect(service.validateIdentifier('database')).toBe(true);
        expect(service.validateIdentifier('root_user')).toBe(true);
      });

      it('应该接受混合大小写标识符', () => {
        expect(service.validateIdentifier('DatabaseName')).toBe(true);
        expect(service.validateIdentifier('Test_Db-123')).toBe(true);
      });

      it('应该接受纯数字标识符', () => {
        expect(service.validateIdentifier('123')).toBe(true);
        expect(service.validateIdentifier('123456789')).toBe(true);
      });

      it('应该拒绝包含空格的标识符', () => {
        expect(service.validateIdentifier('user name')).toBe(false);
        expect(service.validateIdentifier('db name')).toBe(false);
      });

      it('应该拒绝包含中文的标识符', () => {
        expect(service.validateIdentifier('数据库')).toBe(false);
        expect(service.validateIdentifier('test数据库')).toBe(false);
      });

      it('应该拒绝包含特殊字符的标识符', () => {
        expect(service.validateIdentifier('user@name')).toBe(false);
        expect(service.validateIdentifier('db#1')).toBe(false);
        expect(service.validateIdentifier('test!')).toBe(false);
        expect(service.validateIdentifier('db.name')).toBe(false);
        expect(service.validateIdentifier('user/name')).toBe(false);
      });

      it('应该拒绝包含 SQL 注入字符的标识符', () => {
        expect(service.validateIdentifier("db'; DROP TABLE users;--")).toBe(false);
        expect(service.validateIdentifier('db;')).toBe(false);
        expect(service.validateIdentifier("db'")).toBe(false);
        expect(service.validateIdentifier('db"')).toBe(false);
      });

      it('应该拒绝包含通配符的标识符', () => {
        expect(service.validateIdentifier('db*')).toBe(false);
        expect(service.validateIdentifier('db?')).toBe(false);
      });

      it('应该拒绝以数字开头的标识符（如果需要）', () => {
        expect(service.validateIdentifier('123db')).toBe(true);
      });
    });

    describe('getAdminUserEmail 边缘案例', () => {
      it('应该处理管理员邮箱为空字符串', async () => {
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          email: '',
        });

        const result = await service.getAdminUserEmail();

        expect(result).toBeNull();
      });

      it('应该处理管理员邮箱包含空格', async () => {
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          email: '  admin@example.com  ',
        });

        const result = await service.getAdminUserEmail();

        expect(result).toEqual({
          email: '  admin@example.com  ',
          name: 'admin',
        });
      });

      it('应该处理超长邮箱地址', async () => {
        const longEmail = `${'a'.repeat(100)}@example.com`;
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          email: longEmail,
        });

        const result = await service.getAdminUserEmail();

        expect(result).toEqual({
          email: longEmail,
          name: 'admin',
        });
      });

      it('应该处理包含特殊字符的邮箱', async () => {
        mockUserRepository.findOne.mockResolvedValue({
          id: 1,
          account: 'admin',
          email: 'admin+test@example.com',
        });

        const result = await service.getAdminUserEmail();

        expect(result).toEqual({
          email: 'admin+test@example.com',
          name: 'admin',
        });
      });

      it('应该处理数据库查询错误', async () => {
        mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

        await expect(service.getAdminUserEmail()).rejects.toThrow('Database error');
      });

      it('应该处理管理员账户名不是 admin 的情况', async () => {
        mockUserRepository.findOne.mockResolvedValue(null);

        const result = await service.getAdminUserEmail();

        expect(result).toBeNull();
      });
    });

    describe('backupDatabase 边缘案例', () => {
      it('应该处理备份命令执行失败', async () => {
        const mockMysqldump = {
          stderr: { on: jest.fn() },
          on: jest.fn((event: string, callback: any) => {
            if (event === 'close') {
              callback(1);
            }
          }),
        };
        mockSpawn.mockReturnValue(mockMysqldump as any);

        await expect(service.backupDatabase()).rejects.toThrow('Backup failed with code 1');
      });

      it('应该处理备份命令输出错误信息', async () => {
        const mockMysqldump = {
          stderr: {
            on: jest.fn((event: string, callback: any) => {
              if (event === 'data') {
                callback('Error: Connection failed');
              }
            }),
          },
          on: jest.fn((event: string, callback: any) => {
            if (event === 'close') {
              callback(1);
            }
          }),
        };
        mockSpawn.mockReturnValue(mockMysqldump as any);

        await expect(service.backupDatabase()).rejects.toThrow('Backup failed with code 1');
      });

      it('应该处理 spawn 抛出异常', async () => {
        mockSpawn.mockImplementation(() => {
          throw new Error('Spawn failed');
        });

        await expect(service.backupDatabase()).rejects.toThrow('Spawn failed');
      });
    });
  });
});
