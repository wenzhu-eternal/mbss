import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({ description: '状态码', example: 0 })
  statusCode: number;

  @ApiProperty({ description: '消息', example: 'success' })
  message: string;

  @ApiPropertyOptional({ description: '数据' })
  data?: T;

  @ApiProperty({ description: '时间戳', example: '2026-03-28T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: '请求路径', example: '/api/user/findUsers' })
  path: string;
}

export class PageResponseDto<T> {
  @ApiProperty({ description: '数据列表', type: [Object] })
  list: T[];

  @ApiProperty({ description: '总数', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 20 })
  pageSize: number;
}

export class UserResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  account: string;

  @ApiPropertyOptional({ description: '电话' })
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  email?: string;

  @ApiProperty({ description: '是否禁用' })
  isDisable: boolean;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiPropertyOptional({ description: '更新时间' })
  updateTime?: Date;

  @ApiPropertyOptional({ description: '最后登录时间' })
  lastLoginTime?: Date;

  @ApiPropertyOptional({ description: '角色信息' })
  role?: { id: number; name: string };
}

export class RoleResponseDto {
  @ApiProperty({ description: '角色ID' })
  id: number;

  @ApiProperty({ description: '角色名称' })
  name: string;

  @ApiProperty({ description: '是否禁用' })
  isDisable: boolean;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiPropertyOptional({ description: '用户ID' })
  id?: number;
}
