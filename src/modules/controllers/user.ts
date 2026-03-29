import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import {
  GetLoginStateDto,
  GetWeappCodeToLoginDto,
  LoginDto,
  WeappLoginDto,
  WeappLoginToWebDto,
} from '../dtos/auth';
import { AddRoleDto, ToggleRoleStatusDto, UpdateRoleDto } from '../dtos/role';
import { AddUserDto, PageDto, ToggleUserStatusDto, UpdateUserDto } from '../dtos/user';
import AuthService from '../services/auth';
import RoleService from '../services/role';
import UserService from '../services/user';

@ApiTags('用户')
@Controller('user')
export default class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: '添加用户' })
  @Post('addUser')
  async addUser(@Body() addUserDto: AddUserDto): Promise<unknown> {
    return await this.userService.addUser(addUserDto);
  }

  @ApiOperation({ summary: '查看所有用户' })
  @Get('findUsers')
  async findUsers(@Query() pageDto: PageDto): Promise<unknown> {
    return await this.userService.findUsers(pageDto);
  }

  @ApiOperation({ summary: '更新用户' })
  @Post('updateUser')
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<unknown> {
    return await this.userService.updateUser(updateUserDto);
  }

  @ApiOperation({ summary: '启用或禁用用户' })
  @Get('toggleUserStatus')
  async toggleUserStatus(@Query() toggleUserStatusDto: ToggleUserStatusDto): Promise<unknown> {
    return await this.userService.toggleUserStatus(toggleUserStatusDto);
  }

  @ApiOperation({ summary: '查看所有路由' })
  @Get('findApiRoutes')
  async findApiRoutes(): Promise<unknown> {
    return await this.userService.findApiRoutes();
  }

  @ApiOperation({ summary: '添加权限' })
  @Post('addRole')
  async addRole(@Body() addRoleDto: AddRoleDto): Promise<unknown> {
    return await this.roleService.addRole(addRoleDto);
  }

  @ApiOperation({ summary: '查看所有权限' })
  @Get('findRoles')
  async findRoles(@Query() pageDto: PageDto): Promise<unknown> {
    return await this.roleService.findRoles(pageDto);
  }

  @ApiOperation({ summary: '更新权限' })
  @Post('updateRole')
  async updateRole(@Body() updateRoleDto: UpdateRoleDto): Promise<unknown> {
    return await this.roleService.updateRole(updateRoleDto);
  }

  @ApiOperation({ summary: '启用或禁用权限' })
  @Get('toggleRoleStatus')
  async toggleRoleStatus(@Query() toggleRoleStatusDto: ToggleRoleStatusDto): Promise<unknown> {
    return await this.roleService.toggleRoleStatus(toggleRoleStatusDto);
  }

  @ApiOperation({ summary: '添加管理员权限' })
  @Get('addAdmin')
  async addAdmin(): Promise<unknown> {
    return await this.userService.addAdmin();
  }

  @ApiOperation({ summary: '获取当前登录用户信息' })
  @Get('getCurrentUser')
  async getCurrentUser(@Req() request: Request & { userId?: number }): Promise<unknown> {
    return await this.userService.getCurrentUser(request.userId);
  }

  @ApiOperation({ summary: '登录' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Req() request: Request & { session: { user: string | null } },
    @Res() response: Response,
    @Body() loginDto: LoginDto,
  ): Promise<unknown> {
    const { id, token } = await this.authService.login(loginDto);
    request.session.user = token;
    response.cookie('token', token, { httpOnly: true });

    return response.send({
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求成功',
      data: { success: true, id },
    });
  }

  @ApiOperation({ summary: '登出' })
  @Get('loginOut')
  async loginOut(
    @Req() request: Request & { session: { user: string | null } },
    @Res() response: Response,
  ): Promise<unknown> {
    request.session.user = null;
    response.clearCookie('token');

    return response.send({
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求成功',
      data: { success: true },
    });
  }

  @ApiOperation({ summary: '获取登陆状态' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('getLoginState')
  async getLoginState(
    @Req() request: Request & { session: { user: string | null } },
    @Res() response: Response,
    @Query() getLoginStateDto: GetLoginStateDto,
  ): Promise<unknown> {
    const { id, token } = await this.authService.getLoginState(getLoginStateDto);
    request.session.user = token;
    response.cookie('token', token, { httpOnly: true });

    return response.send({
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求成功',
      data: !!id ? { success: true, id } : { success: false },
    });
  }

  @ApiOperation({ summary: 'weapp登录' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('weappLogin')
  async weappLogin(
    @Req() request: Request,
    @Res() response: Response,
    @Body() weappLoginDto: WeappLoginDto,
  ): Promise<unknown> {
    const weappUserInfo = await this.authService.getWeappUserOpenid(weappLoginDto);
    const { id, token } = await this.authService.weappLogin({
      ...weappUserInfo,
      ...weappLoginDto,
    });

    response.cookie('token', token, { httpOnly: true });
    response.cookie('openid', weappUserInfo.openid, { httpOnly: true });

    return response.send({
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求成功',
      data: !!id ? { success: true, id } : { success: false },
    });
  }

  @ApiOperation({ summary: 'web使用weapp登录' })
  @Post('weappLoginToweb')
  async weappLoginToweb(@Body() weappLoginToWebDto: WeappLoginToWebDto): Promise<unknown> {
    const weappUserInfo = await this.authService.getWeappUserOpenid(weappLoginToWebDto);
    return await this.authService.weappLoginToWeb({
      ...weappUserInfo,
      ...weappLoginToWebDto,
    });
  }

  @ApiOperation({ summary: '获取微信小程序二维码登陆' })
  @Get('getWeappCodeToLogin')
  async getWeappCodeToLogin(
    @Query() getWeappCodeToLoginDto: GetWeappCodeToLoginDto,
  ): Promise<unknown> {
    const { access_token } = await this.authService.getWeappAccessToken();
    return await this.authService.getWeappCode({
      access_token,
      type: getWeappCodeToLoginDto.type,
      path: `pages/login/index?unique=${getWeappCodeToLoginDto.unique}`,
    });
  }
}
