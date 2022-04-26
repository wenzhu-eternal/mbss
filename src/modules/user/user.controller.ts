import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  AddUserDto,
  EDUserDto,
  GetUsersDto,
  LoginDto,
  UpdataUserDto,
} from './user.dto';
import UserService from './user.service';

@ApiTags('用户')
@Controller('user')
export default class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '添加用户' })
  @Post('addUser')
  async addUser(@Body() addUserDto: AddUserDto): Promise<any> {
    return this.userService.addUser(addUserDto);
  }

  @ApiOperation({ summary: '查看所有用户' })
  @Get('findUsers')
  async findUsers(@Query() getUsersDto: GetUsersDto): Promise<any> {
    return this.userService.findUsers(getUsersDto);
  }

  @ApiOperation({ summary: '更新用户' })
  @Post('updataUser')
  async updataUser(@Body() updataUserDto: UpdataUserDto): Promise<any> {
    return this.userService.updataUser(updataUserDto);
  }

  @ApiOperation({ summary: '启用或禁用用户' })
  @Get('edUser')
  async edUser(@Query() edUsersDto: EDUserDto): Promise<any> {
    return this.userService.edUser(edUsersDto);
  }

  @ApiOperation({ summary: '登录' })
  @Post('login')
  async login(
    @Req() request,
    @Res() response: Response,
    @Body() loginDto: LoginDto,
  ): Promise<any> {
    const { id, token } = await this.userService.login(loginDto);
    if (id) {
      request.session.user = token;
      response.cookie('token', token, { httpOnly: true });
    } else {
      request.session.user = null;
      response.clearCookie('token');
    }

    return response.send({
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求成功',
      data: !!id ? { success: true, id } : { success: false },
    });
  }

  @ApiOperation({ summary: '登出' })
  @Get('loginOut')
  async loginOut(@Req() request, @Res() response: Response): Promise<any> {
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
}
