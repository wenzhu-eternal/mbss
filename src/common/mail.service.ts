import { Injectable, Logger, Module } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const logger = new Logger('MailService');

export interface Attachment {
  filename: string;
  path: string;
  contentType?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, unknown>;
  attachments?: Attachment[];
}

const MAIL_TEMPLATES = {
  welcome: {
    subject: '欢迎加入易旅客',
    template: './welcome',
  },
  verification: {
    subject: '您的验证码',
    template: './verification',
  },
  backup: {
    subject: '数据库备份通知',
    template: './backup',
  },
} as const;

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      await this.mailerService.sendMail({
        to: recipients,
        subject: options.subject,
        template: options.template,
        context: options.context,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
        })),
      });

      logger.log(`邮件发送成功: ${recipients}`);
      return true;
    } catch (error) {
      logger.error(`邮件发送失败: ${(error as Error).message}`);
      return false;
    }
  }

  async sendWelcome(to: string, name: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: MAIL_TEMPLATES.welcome.subject,
      template: MAIL_TEMPLATES.welcome.template,
      context: { name },
    });
  }

  async sendVerification(
    to: string,
    name: string,
    code: string,
    expireMinutes: number,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: MAIL_TEMPLATES.verification.subject,
      template: MAIL_TEMPLATES.verification.template,
      context: { name, code, expireMinutes },
    });
  }

  async sendBackup(
    to: string,
    name: string,
    backupDate: string,
    attachmentPath: string,
  ): Promise<boolean> {
    const filename = attachmentPath.split('/').pop() || 'backup.sql';
    return this.sendMail({
      to,
      subject: MAIL_TEMPLATES.backup.subject,
      template: MAIL_TEMPLATES.backup.template,
      context: { name, backupDate },
      attachments: [
        {
          filename,
          path: attachmentPath,
          contentType: 'application/sql',
        },
      ],
    });
  }
}

@Module({
  providers: [MailService],
  exports: [MailService],
})
export default class MailModule {}
