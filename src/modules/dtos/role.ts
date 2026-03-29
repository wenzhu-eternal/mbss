import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { IdDto, PageDto } from './common';

export { PageDto, IdDto as ToggleRoleStatusDto };

export class AddRoleDto {
  @ApiProperty({ description: '权限名', example: '管理员' })
  @IsNotEmpty({ message: '权限名不能为空' })
  @IsString({ message: '权限名必须是字符串' })
  readonly name: string;

  @ApiProperty({ description: '路由', example: ['/api/user/addUser'] })
  @IsNotEmpty({ message: '路由不能为空' })
  @IsArray({ message: '路由必须是数组' })
  @IsString({ each: true, message: '路由项必须是字符串' })
  readonly apiRoutes: string[];
}

export class UpdateRoleDto extends PartialType(AddRoleDto) {
  @ApiProperty({ description: '权限ID', example: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  @Type(() => Number)
  readonly id: number;
}
