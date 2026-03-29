import { HttpException, HttpStatus } from '@nestjs/common';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/sql',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_FILE_SIZE = 1;

const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.vbs',
  '.js',
  '.jar',
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
  '.cgi',
  '.pl',
];

const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.bmp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.html',
  '.css',
  '.json',
  '.mp4',
  '.mp3',
  '.wav',
  '.zip',
  '.rar',
  '.sql',
];

export function validateFile(file: Express.Multer.File): void {
  if (!file) {
    throw new HttpException({ message: '未检测到上传文件' }, HttpStatus.BAD_REQUEST);
  }

  if (file.size < MIN_FILE_SIZE) {
    throw new HttpException({ message: '文件内容为空' }, HttpStatus.BAD_REQUEST);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new HttpException(
      { message: `文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      HttpStatus.BAD_REQUEST,
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new HttpException(
      { message: `不支持的文件类型: ${file.mimetype}` },
      HttpStatus.BAD_REQUEST,
    );
  }

  const originalName = file.originalname.toLowerCase();
  const hasDangerousExt = DANGEROUS_EXTENSIONS.some(ext => originalName.endsWith(ext));
  if (hasDangerousExt) {
    throw new HttpException({ message: '不允许上传此类型的文件' }, HttpStatus.BAD_REQUEST);
  }

  const ext = `.${originalName.split('.').pop() || ''}`;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new HttpException({ message: '不支持的文件扩展名' }, HttpStatus.BAD_REQUEST);
  }
}

export function sanitizeFilename(filename: string): string {
  const ext = filename.split('.').pop() || '';
  const baseName = filename.replace(`.${ext}`, '');
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').substring(0, 100);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}-${sanitizedBaseName}.${ext}`;
}

export function validateFilename(filename: string): void {
  if (!filename || typeof filename !== 'string') {
    throw new HttpException({ message: '文件名无效' }, HttpStatus.BAD_REQUEST);
  }

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new HttpException({ message: '非法的文件名' }, HttpStatus.BAD_REQUEST);
  }

  if (filename.includes('\0')) {
    throw new HttpException({ message: '非法的文件名' }, HttpStatus.BAD_REQUEST);
  }

  if (filename.startsWith('.') || filename.endsWith('.')) {
    throw new HttpException({ message: '非法的文件名' }, HttpStatus.BAD_REQUEST);
  }

  const decodedFilename = decodeURIComponent(filename);
  if (decodedFilename !== filename) {
    if (
      decodedFilename.includes('..') ||
      decodedFilename.includes('/') ||
      decodedFilename.includes('\\')
    ) {
      throw new HttpException({ message: '非法的文件名' }, HttpStatus.BAD_REQUEST);
    }
  }

  const ext = `.${filename.split('.').pop()?.toLowerCase() || ''}`;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new HttpException({ message: '不支持的文件类型' }, HttpStatus.BAD_REQUEST);
  }
}

export function isPathSafe(filePath: string, baseDir: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedBase = baseDir.replace(/\\/g, '/');

  if (!normalizedPath.startsWith(normalizedBase)) {
    return false;
  }

  const relativePath = normalizedPath.slice(normalizedBase.length);
  if (relativePath.includes('..')) {
    return false;
  }

  return true;
}
