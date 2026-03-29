import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class PageDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  readonly page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  readonly pageSize?: number;
}

export class IdDto {
  @ApiProperty({ description: 'ID', example: 1 })
  @IsNotEmpty({ message: 'ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: 'ID必须是数字' })
  readonly id: number;
}

export class TimeRangeDto {
  @ApiProperty({ description: '开始时间', example: '2026-03-01' })
  @IsNotEmpty({ message: '开始时间不能为空' })
  readonly startTime: string;

  @ApiProperty({ description: '结束时间', example: '2026-03-28' })
  @IsNotEmpty({ message: '结束时间不能为空' })
  readonly endTime: string;
}
