import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ErrorSource } from '../entities/errorLog';
import { IdDto } from './common';

export { IdDto as ResolveErrorDto };

export class ReportErrorDto {
  @ApiProperty({
    description: '错误来源',
    enum: ['frontend', 'backend', 'taro'],
    example: 'frontend',
  })
  @IsEnum(['frontend', 'backend', 'taro'], { message: '错误来源不合法' })
  readonly source: ErrorSource;

  @ApiProperty({
    description: '错误类型',
    example: 'js_error',
  })
  @IsString()
  @IsNotEmpty({ message: '错误类型不能为空' })
  readonly errorType: string;

  @ApiProperty({
    description: '错误消息',
    example: 'Uncaught TypeError: Cannot read property of undefined',
  })
  @IsString()
  @IsNotEmpty({ message: '错误消息不能为空' })
  readonly message: string;

  @ApiPropertyOptional({
    description: '错误堆栈',
  })
  @IsOptional()
  @IsString()
  readonly stack?: string;

  @ApiPropertyOptional({
    description: '发生文件',
  })
  @IsOptional()
  @IsString()
  readonly file?: string;

  @ApiPropertyOptional({
    description: '行号',
  })
  @IsOptional()
  readonly line?: number;

  @ApiPropertyOptional({
    description: '列号',
  })
  @IsOptional()
  readonly column?: number;

  @ApiPropertyOptional({
    description: '请求URL',
  })
  @IsOptional()
  @IsString()
  readonly url?: string;

  @ApiPropertyOptional({
    description: '请求方法',
  })
  @IsOptional()
  @IsString()
  readonly method?: string;

  @ApiPropertyOptional({
    description: 'HTTP状态码',
  })
  @IsOptional()
  readonly statusCode?: number;

  @ApiPropertyOptional({
    description: '额外数据',
  })
  @IsOptional()
  readonly extra?: Record<string, unknown>;
}

export class QueryErrorLogDto {
  @ApiPropertyOptional({
    description: '页码',
    default: 1,
  })
  @IsOptional()
  readonly page?: number;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 20,
  })
  @IsOptional()
  readonly pageSize?: number;

  @ApiPropertyOptional({
    description: '错误来源',
    enum: ['frontend', 'backend', 'taro'],
  })
  @IsOptional()
  @IsEnum(['frontend', 'backend', 'taro'], { message: '错误来源不合法' })
  readonly source?: ErrorSource;

  @ApiPropertyOptional({
    description: '错误类型',
  })
  @IsOptional()
  @IsString()
  readonly errorType?: string;

  @ApiPropertyOptional({
    description: '是否已处理（传 0 或 1）',
  })
  @IsOptional()
  readonly isResolved?: string;

  @ApiPropertyOptional({
    description: '开始时间',
  })
  @IsOptional()
  @IsString()
  readonly startTime?: string;

  @ApiPropertyOptional({
    description: '结束时间',
  })
  @IsOptional()
  @IsString()
  readonly endTime?: string;

  @ApiPropertyOptional({
    description: '关键词搜索',
  })
  @IsOptional()
  @IsString()
  readonly keyword?: string;
}

export class AddWhitelistDto {
  @ApiProperty({
    description: '规则名称',
  })
  @IsNotEmpty({ message: '规则名称不能为空' })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: '匹配类型',
    enum: ['message', 'url', 'errorType', 'file'],
  })
  @IsEnum(['message', 'url', 'errorType', 'file'], { message: '匹配类型不合法' })
  readonly matchType: 'message' | 'url' | 'errorType' | 'file';

  @ApiProperty({
    description: '匹配模式（正则表达式）',
  })
  @IsNotEmpty({ message: '匹配模式不能为空' })
  @IsString()
  readonly pattern: string;

  @ApiPropertyOptional({
    description: '备注',
  })
  @IsOptional()
  @IsString()
  readonly remark?: string;
}

export class UpdateWhitelistDto extends AddWhitelistDto {
  @ApiProperty({
    description: '白名单ID',
  })
  @IsNotEmpty({ message: '白名单ID不能为空' })
  readonly id: number;

  @ApiPropertyOptional({
    description: '是否启用',
  })
  @IsOptional()
  readonly isEnabled?: boolean;
}

export class DeleteWhitelistDto {
  @ApiProperty({
    description: '白名单ID',
  })
  @IsNotEmpty({ message: '白名单ID不能为空' })
  readonly id: number;
}
