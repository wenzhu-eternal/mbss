import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

interface FileValidationResult {
  isValid: boolean;
  reason?: string;
}

@Injectable()
export class FileContentValidator {
  private readonly logger = new Logger(FileContentValidator.name);

  private readonly MAGIC_NUMBERS: Record<string, Buffer> = {
    'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
    'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    'image/gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
    'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]),
  };

  async validateFileContent(
    filePath: string,
    expectedMimeType: string,
  ): Promise<FileValidationResult> {
    try {
      const buffer = fs.readFileSync(filePath);

      const magicNumber = this.MAGIC_NUMBERS[expectedMimeType];
      if (!magicNumber) {
        return { isValid: true };
      }

      const fileHeader = buffer.slice(0, magicNumber.length);
      const isValid = magicNumber.equals(fileHeader);

      if (!isValid) {
        this.logger.warn(
          `File content mismatch: expected ${expectedMimeType}, got different content`,
        );
        return {
          isValid: false,
          reason: '文件内容与扩展名不匹配',
        };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error(`File validation error: ${(error as Error).message}`);
      return {
        isValid: false,
        reason: '文件验证失败',
      };
    }
  }

  async scanForMalware(filePath: string): Promise<FileValidationResult> {
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /data:text\/html/i];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: '检测到潜在恶意内容',
          };
        }
      }

      return { isValid: true };
    } catch {
      return { isValid: true };
    }
  }
}
