import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @ApiPropertyOptional({
    required: true,
    description: '用户名',
    default: 'admin',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  readonly account: string;

  @ApiPropertyOptional({
    required: true,
    description: '密码',
    default: '888888',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  readonly password: string;
}

export class AddUserDto extends LoginDto {
  @ApiPropertyOptional({ required: true, description: '电话', default: '110' })
  @IsOptional()
  readonly phone: string;

  @ApiPropertyOptional({
    required: true,
    description: '邮箱',
    default: '110@qq.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  readonly email: string;

  @ApiPropertyOptional({
    required: true,
    description: '权限ID',
    default: 1,
  })
  @IsNumber({}, { message: '权限ID必须是数字' })
  readonly role: number;
}

export class GetUsersDto {
  @ApiPropertyOptional({ required: true, description: '页码', default: 1 })
  @IsNumber({}, { message: '页码必须是数字' })
  @Type(() => Number)
  readonly page: number;

  @ApiPropertyOptional({ required: true, description: '单页数量', default: 10 })
  @IsNumber({}, { message: '单页数量必须是数字' })
  @Type(() => Number)
  readonly pageSize: number;
}

export class UpdateUserDto extends AddUserDto {
  @ApiPropertyOptional({ required: true, description: '用户ID', default: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  readonly id: number;
}

export class ToggleUserStatusDto {
  @ApiPropertyOptional({ required: true, description: '用户ID', default: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  readonly id: number;
}

export class AddRoleDto {
  @ApiPropertyOptional({
    required: true,
    description: '权限名',
    default: '管理员',
  })
  @IsNotEmpty({ message: '权限名不能为空' })
  readonly name: string;

  @ApiPropertyOptional({
    required: true,
    description: '路由',
    default: ['/api/user/addUser'],
  })
  readonly apiRoutes: string[];
}

export class GetRolesDto {
  @ApiPropertyOptional({ required: true, description: '页码', default: 1 })
  @IsNumber({}, { message: '页码必须是数字' })
  @Type(() => Number)
  readonly page: number;

  @ApiPropertyOptional({ required: true, description: '单页数量', default: 10 })
  @IsNumber({}, { message: '单页数量必须是数字' })
  @Type(() => Number)
  readonly pageSize: number;
}

export class UpdateRoleDto extends AddRoleDto {
  @ApiPropertyOptional({ required: true, description: '权限ID', default: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  @IsNumber({}, { message: '权限ID必须是数字' })
  readonly id: number;
}

export class ToggleRoleStatusDto {
  @ApiPropertyOptional({ required: true, description: '权限ID', default: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  @IsNumber({}, { message: '权限ID必须是数字' })
  readonly id: number;
}
