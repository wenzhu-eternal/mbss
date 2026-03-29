import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { MailService } from '@/common/mail.service';

describe('MailService', () => {
  let service: MailService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMail', () => {
    it('应该成功发送邮件', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendMail({
        to: 'test@example.com',
        subject: '测试邮件',
        template: './test',
        context: { name: '测试用户' },
      });

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '测试邮件',
        template: './test',
        context: { name: '测试用户' },
        attachments: undefined,
      });
    });

    it('应该支持多个收件人', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendMail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: '群发邮件',
        template: './test',
        context: {},
      });

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com, user2@example.com',
        }),
      );
    });

    it('应该正确处理附件', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendMail({
        to: 'test@example.com',
        subject: '带附件的邮件',
        template: './test',
        context: {},
        attachments: [
          {
            filename: 'test.pdf',
            path: '/path/to/test.pdf',
            contentType: 'application/pdf',
          },
        ],
      });

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'test.pdf',
              path: '/path/to/test.pdf',
              contentType: 'application/pdf',
            },
          ],
        }),
      );
    });

    it('发送失败时应该返回 false', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await service.sendMail({
        to: 'test@example.com',
        subject: '测试邮件',
        template: './test',
        context: {},
      });

      expect(result).toBe(false);
    });
  });

  describe('sendWelcome', () => {
    it('应该发送欢迎邮件', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendWelcome('test@example.com', '张三');

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '欢迎加入易旅客',
        template: './welcome',
        context: { name: '张三' },
      });
    });
  });

  describe('sendVerification', () => {
    it('应该发送验证码邮件', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendVerification('test@example.com', '张三', '123456', 5);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '您的验证码',
        template: './verification',
        context: { name: '张三', code: '123456', expireMinutes: 5 },
      });
    });
  });

  describe('sendBackup', () => {
    it('应该发送备份通知邮件', async () => {
      mockMailerService.sendMail.mockResolvedValue({});

      const result = await service.sendBackup(
        'admin@example.com',
        '管理员',
        '2024-01-01',
        '/backup/2024-01-01_database_backup.sql',
      );

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'admin@example.com',
        subject: '数据库备份通知',
        template: './backup',
        context: { name: '管理员', backupDate: '2024-01-01' },
        attachments: [
          {
            filename: '2024-01-01_database_backup.sql',
            path: '/backup/2024-01-01_database_backup.sql',
            contentType: 'application/sql',
          },
        ],
      });
    });
  });

  describe('边缘案例测试', () => {
    describe('sendMail 边缘案例', () => {
      it('应该处理超长邮件地址', async () => {
        const longEmail = `${'a'.repeat(100)}@example.com`;
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: longEmail,
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理包含特殊字符的邮件地址', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'user+test@example.com',
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理超长邮件主题', async () => {
        const longSubject = '测试邮件主题'.repeat(100);
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: longSubject,
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理空主题', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理大量收件人', async () => {
        const manyRecipients = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: manyRecipients,
          subject: '群发邮件',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理空收件人列表', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: [],
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理多个附件', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '多附件邮件',
          template: './test',
          context: {},
          attachments: [
            { filename: 'file1.pdf', path: '/path/to/file1.pdf' },
            { filename: 'file2.xlsx', path: '/path/to/file2.xlsx' },
            { filename: 'file3.png', path: '/path/to/file3.png' },
          ],
        });

        expect(result).toBe(true);
        expect(mockMailerService.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            attachments: expect.arrayContaining([
              expect.objectContaining({ filename: 'file1.pdf' }),
              expect.objectContaining({ filename: 'file2.xlsx' }),
              expect.objectContaining({ filename: 'file3.png' }),
            ]),
          }),
        );
      });

      it('应该处理包含中文的邮件内容', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '中文主题测试',
          template: './test',
          context: {
            name: '张三',
            message: '这是一封中文邮件',
          },
        });

        expect(result).toBe(true);
      });

      it('应该处理包含 Unicode 字符的邮件内容', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: 'Unicode 测试 😀🎉',
          template: './test',
          context: {
            emoji: '😀🎉🚀',
            symbols: '©®™',
          },
        });

        expect(result).toBe(true);
      });

      it('应该处理空上下文', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(true);
      });

      it('应该处理深层嵌套的上下文', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '测试',
          template: './test',
          context: {
            user: {
              profile: {
                address: {
                  city: '北京',
                  street: '长安街',
                },
              },
            },
          },
        });

        expect(result).toBe(true);
      });

      it('应该处理 SMTP 连接超时', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(false);
      });

      it('应该处理 SMTP 认证失败', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('Authentication failed'));

        const result = await service.sendMail({
          to: 'test@example.com',
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(false);
      });

      it('应该处理无效的邮件地址格式', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('Invalid email'));

        const result = await service.sendMail({
          to: 'invalid-email',
          subject: '测试',
          template: './test',
          context: {},
        });

        expect(result).toBe(false);
      });
    });

    describe('sendWelcome 边缘案例', () => {
      it('应该处理超长用户名', async () => {
        const longName = '张'.repeat(100);
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendWelcome('test@example.com', longName);

        expect(result).toBe(true);
      });

      it('应该处理空用户名', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendWelcome('test@example.com', '');

        expect(result).toBe(true);
      });

      it('应该处理包含特殊字符的用户名', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendWelcome(
          'test@example.com',
          "张<script>alert('xss')</script>",
        );

        expect(result).toBe(true);
      });

      it('应该处理发送失败', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

        const result = await service.sendWelcome('test@example.com', '张三');

        expect(result).toBe(false);
      });
    });

    describe('sendVerification 边缘案例', () => {
      it('应该处理不同长度的验证码', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const codes = ['123456', '12345', '12345678'];

        for (const code of codes) {
          const result = await service.sendVerification('test@example.com', '张三', code, 5);
          expect(result).toBe(true);
        }
      });

      it('应该处理零过期时间', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendVerification('test@example.com', '张三', '123456', 0);

        expect(result).toBe(true);
      });

      it('应该处理超长过期时间', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendVerification(
          'test@example.com',
          '张三',
          '123456',
          Number.MAX_SAFE_INTEGER,
        );

        expect(result).toBe(true);
      });

      it('应该处理包含字母的验证码', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendVerification('test@example.com', '张三', 'ABC123', 5);

        expect(result).toBe(true);
      });

      it('应该处理发送失败', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

        const result = await service.sendVerification('test@example.com', '张三', '123456', 5);

        expect(result).toBe(false);
      });
    });

    describe('sendBackup 边缘案例', () => {
      it('应该处理超长备份路径', async () => {
        const longPath = `${'/backup/'.repeat(100)}backup.sql`;
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendBackup(
          'admin@example.com',
          '管理员',
          '2024-01-01',
          longPath,
        );

        expect(result).toBe(true);
      });

      it('应该处理包含特殊字符的备份文件名', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const result = await service.sendBackup(
          'admin@example.com',
          '管理员',
          '2024-01-01',
          '/backup/backup_2024-01-01_v1.0.sql',
        );

        expect(result).toBe(true);
      });

      it('应该处理不同日期格式', async () => {
        mockMailerService.sendMail.mockResolvedValue({});

        const dates = ['2024-01-01', '2024/01/01', '01-01-2024'];

        for (const date of dates) {
          const result = await service.sendBackup(
            'admin@example.com',
            '管理员',
            date,
            '/backup/file.sql',
          );
          expect(result).toBe(true);
        }
      });

      it('应该处理发送失败', async () => {
        mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

        const result = await service.sendBackup(
          'admin@example.com',
          '管理员',
          '2024-01-01',
          '/backup/backup.sql',
        );

        expect(result).toBe(false);
      });
    });
  });
});
