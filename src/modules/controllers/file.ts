import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { join, resolve } from 'path';

import { FileContentValidator } from '@/common/file-content-validator';
import {
  isPathSafe,
  sanitizeFilename,
  validateFile,
  validateFilename,
} from '@/common/file-validator';
import config from '@/config/config.default';

import { FileUploadDto } from '../dtos/file';

@ApiTags('文件')
@Controller('file')
export default class FileController {
  constructor(private readonly fileContentValidator: FileContentValidator) {}

  private getUploadDir(): string {
    return config.uploadDir || join(process.cwd(), 'uploads');
  }

  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '请上传文件',
    type: FileUploadDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = config.uploadDir || join(process.cwd(), 'uploads');
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const safeName = sanitizeFilename(file.originalname);
          cb(null, safeName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async upload(@Req() request: Request, @UploadedFile() file: Express.Multer.File) {
    validateFile(file);

    const filePath = join(this.getUploadDir(), file.filename);

    const contentValidation = await this.fileContentValidator.validateFileContent(
      filePath,
      file.mimetype,
    );

    if (!contentValidation.isValid) {
      fs.unlinkSync(filePath);
      throw new HttpException({ message: contentValidation.reason }, HttpStatus.BAD_REQUEST);
    }

    const malwareScan = await this.fileContentValidator.scanForMalware(filePath);

    if (!malwareScan.isValid) {
      fs.unlinkSync(filePath);
      throw new HttpException({ message: malwareScan.reason }, HttpStatus.BAD_REQUEST);
    }

    const protocol = request.protocol;
    const host = request.get('host');
    const fileUrl = `${protocol}://${host}/api/file/${file.filename}`;

    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
    };
  }

  @ApiOperation({ summary: '获取文件（预览）' })
  @ApiParam({ name: 'filename', description: '文件名', type: String })
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() response: Response) {
    validateFilename(filename);

    const uploadDir = this.getUploadDir();
    const filePath = resolve(uploadDir, filename);

    if (!isPathSafe(filePath, uploadDir)) {
      return response.status(403).json({
        statusCode: 403,
        message: '禁止访问',
      });
    }

    if (!fs.existsSync(filePath)) {
      return response.status(404).json({
        statusCode: 404,
        message: '文件不存在',
      });
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      return response.status(403).json({
        statusCode: 403,
        message: '禁止访问目录',
      });
    }

    const fileSize = stat.size;
    const range = response.req?.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return response.status(416).json({
          statusCode: 416,
          message: '请求范围无效',
        });
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      response.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': this.getMimeType(filename),
      });

      return file.pipe(response);
    }

    response.setHeader('Content-Type', this.getMimeType(filename));
    response.setHeader('Content-Length', fileSize);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Cache-Control', 'public, max-age=31536000');

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(response);
  }

  @ApiOperation({ summary: '下载文件' })
  @ApiParam({ name: 'filename', description: '文件名', type: String })
  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() response: Response) {
    validateFilename(filename);

    const uploadDir = this.getUploadDir();
    const filePath = resolve(uploadDir, filename);

    if (!isPathSafe(filePath, uploadDir)) {
      return response.status(403).json({
        statusCode: 403,
        message: '禁止访问',
      });
    }

    if (!fs.existsSync(filePath)) {
      return response.status(404).json({
        statusCode: 404,
        message: '文件不存在',
      });
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      return response.status(403).json({
        statusCode: 403,
        message: '禁止访问目录',
      });
    }

    const fileSize = stat.size;

    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    response.setHeader('Content-Length', fileSize);

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(response);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      bmp: 'image/bmp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      json: 'application/json',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      sql: 'application/sql',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
