import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, Length } from 'class-validator';

import { IsPhone } from '@/common/validators/is-phone.validator';

import { IdDto, PageDto } from './common';

export { PageDto, IdDto as ToggleUserStatusDto };

export class UserBaseDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(3, 20, { message: '用户名长度必须在3-20之间' })
  readonly account: string;

  @ApiPropertyOptional({ description: '电话', example: '13800138000' })
  @IsOptional()
  @IsPhone({ message: '手机号格式不正确' })
  readonly phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'admin@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  readonly email?: string;

  @ApiProperty({ description: '权限ID', example: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '权限ID必须是数字' })
  readonly roleId: number;
}

export class AddUserDto extends UserBaseDto {
  @ApiPropertyOptional({ description: '密码', example: '123456' })
  @IsOptional()
  readonly password?: string;
}

export class UpdateUserDto extends PartialType(OmitType(UserBaseDto, ['account'] as const)) {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  readonly id: number;

  @ApiPropertyOptional({ description: '用户名', example: 'newadmin' })
  @IsOptional()
  @Length(3, 20, { message: '用户名长度必须在3-20之间' })
  readonly account?: string;

  @ApiPropertyOptional({ description: '新密码（如需修改）', example: 'newpassword' })
  @IsOptional()
  readonly password?: string;
}
