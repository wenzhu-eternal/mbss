import { Injectable, Logger, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import * as dayjs from 'dayjs';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import { Cron, NestSchedule } from 'nest-schedule';
import { join } from 'path';
import { Repository } from 'typeorm';

import MailModule, { MailService } from '@/common/mail.service';
import config from '@/config/config.default';
import UserEntity from '@/modules/entities/user';

const logger = new Logger('TasksService');

const MAX_BACKUP_FILES = 30;

@Injectable()
class TasksService extends NestSchedule {
  constructor(
    private readonly mailService: MailService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  private validatePath(path: string): boolean {
    const dangerousPatterns = /[;&|`$(){}[\]\\<>!]/;
    return !dangerousPatterns.test(path);
  }

  private validateIdentifier(identifier: string): boolean {
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(identifier);
  }

  private async ensureBackupDir(backupDir: string): Promise<void> {
    try {
      await mkdir(backupDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private async cleanOldBackups(backupDir: string): Promise<void> {
    try {
      const files = await readdir(backupDir);
      const backupFiles = files.filter(f => f.endsWith('_database_backup.sql'));

      if (backupFiles.length <= MAX_BACKUP_FILES) {
        return;
      }

      const fileStats = await Promise.all(
        backupFiles.map(async file => {
          const filePath = join(backupDir, file);
          const stats = await stat(filePath);
          return { file, mtime: stats.mtime.getTime() };
        }),
      );

      fileStats.sort((a, b) => b.mtime - a.mtime);

      const filesToDelete = fileStats.slice(MAX_BACKUP_FILES);
      for (const { file } of filesToDelete) {
        const filePath = join(backupDir, file);
        await unlink(filePath);
        logger.log(`已删除旧备份文件: ${file}`);
      }
    } catch (error) {
      logger.warn(`清理旧备份文件失败: ${(error as Error).message}`);
    }
  }

  private async getAdminUserEmail(): Promise<{ email: string; name: string } | null> {
    const adminUser = await this.userRepository.findOne({
      where: { account: 'admin' },
      select: ['id', 'account', 'email'],
    });

    if (!adminUser || !adminUser.email) {
      logger.error('获取管理员邮箱失败');
      return null;
    }

    return {
      email: adminUser.email,
      name: adminUser.account,
    };
  }

  @Cron('0 0 0 * * *')
  async backupDatabase(): Promise<void> {
    const { mysql, uploadDir } = config;

    if (!mysql) {
      logger.error('数据库配置不存在');
      return;
    }

    const username = mysql.username as string;
    const password = mysql.password as string;
    const database = mysql.database as string;
    const host = (mysql as Record<string, unknown>).host as string;
    const port = (mysql as Record<string, unknown>).port as number;

    if (!this.validateIdentifier(username) || !this.validateIdentifier(database)) {
      logger.error('数据库用户名或数据库名包含非法字符');
      return;
    }

    const backupDir = String(uploadDir);
    if (!this.validatePath(backupDir)) {
      logger.error('备份路径包含非法字符');
      return;
    }

    const backupFileName = `${dayjs().format('YYYY-MM-DD')}_database_backup.sql`;
    const backupPath = join(backupDir, backupFileName);

    try {
      await this.ensureBackupDir(backupDir);
    } catch (error) {
      logger.error(`创建备份目录失败: ${(error as Error).message}`);
      return;
    }

    const backupPromise = new Promise<void>((resolve, reject) => {
      const mysqldump = spawn(
        'mysqldump',
        [
          '-h',
          host,
          '-P',
          String(port),
          '-u',
          username,
          database,
          '--single-transaction',
          '--routines',
          '--triggers',
          '--result-file',
          backupPath,
        ],
        {
          env: {
            ...process.env,
            MYSQL_PWD: password,
          },
        },
      );

      let stderr = '';

      mysqldump.stderr.on('data', data => {
        stderr += data.toString();
      });

      mysqldump.on('error', error => {
        logger.error(`数据库备份进程错误: ${error.message}`);
        reject(error);
      });

      mysqldump.on('close', code => {
        if (code === 0) {
          logger.log(`数据库备份成功: ${backupFileName}`);
          resolve();
        } else {
          logger.error(`数据库备份失败，退出码: ${code}, stderr: ${stderr}`);
          reject(new Error(`mysqldump exited with code ${code}`));
        }
      });
    });

    try {
      await backupPromise;
      await this.cleanOldBackups(backupDir);

      const adminInfo = await this.getAdminUserEmail();
      if (adminInfo) {
        await this.mailService.sendBackup(
          adminInfo.email,
          adminInfo.name,
          dayjs().format('YYYY-MM-DD'),
          backupPath,
        );
        logger.log(`备份邮件已发送至管理员: ${adminInfo.email}`);
      } else {
        logger.warn('备份完成，但未找到管理员邮箱，跳过邮件发送');
      }
    } catch (error) {
      logger.error(`数据库备份过程出错: ${(error as Error).message}`);
    }
  }
}

@Module({
  imports: [MailModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [TasksService],
  exports: [TasksService],
})
export default class TasksModule {}
