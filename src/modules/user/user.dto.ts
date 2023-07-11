import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

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
  readonly phone: string;

  @ApiPropertyOptional({
    required: true,
    description: 'e-mil',
    default: '110@qq.com',
  })
  readonly emil: string;

  @ApiPropertyOptional({
    required: true,
    description: '权限ID',
    default: 1,
  })
  readonly role: number;
}

export class GetUsersDto {
  @ApiPropertyOptional({ required: true, description: '页码', default: 1 })
  readonly page: number;

  @ApiPropertyOptional({ required: true, description: '单页数量', default: 10 })
  readonly pageSize: number;
}

export class UpdataUserDto extends AddUserDto {
  @ApiPropertyOptional({ required: true, description: '用户ID', default: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  readonly id: number;
}

export class EDUserDto {
  @ApiPropertyOptional({ required: true, description: '用户ID', default: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  readonly id: number;
}

export class AddRoleDto {
  @ApiPropertyOptional({
    required: true,
    description: '权限名',
    default: '管理员',
  })
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
  readonly page: number;

  @ApiPropertyOptional({ required: true, description: '单页数量', default: 10 })
  readonly pageSize: number;
}

export class UpdataRoleDto extends AddRoleDto {
  @ApiPropertyOptional({ required: true, description: '权限ID', default: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  readonly id: number;
}

export class EDRoleDto {
  @ApiPropertyOptional({ required: true, description: '权限ID', default: 1 })
  @IsNotEmpty({ message: '权限ID不能为空' })
  readonly id: number;
}
