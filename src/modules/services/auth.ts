import { RedisService } from '@liaoliaots/nestjs-redis';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { RequestService } from '@/common/request.service';
import config from '@/config/config.default';
import { createWeappCodeUrl } from '@/config/util';

import {
  GetLoginStateDto,
  GetWeappCodeDto,
  GetWeappCodeToLoginDto,
  GetWeappUserOpenidDto,
  LoginDto,
  WeappLoginDto,
  WeappLoginToWebDto,
} from '../dtos/auth';
import RoleEntity from '../entities/role';
import UserEntity from '../entities/user';

interface LoginResult {
  id: number;
  token: string;
}

interface WeappUserInfo {
  openid: string;
  session_key?: string;
}

interface WeappAccessToken {
  access_token: string;
  expires_in?: number;
  errcode?: number;
}

@Injectable()
export default class AuthService {
  private readonly redis: Redis;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
    private readonly requestService: RequestService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepository.findOne({
      where: { account: loginDto.account, isDisable: false },
      select: ['id', 'account', 'password'],
    });

    if (!user) {
      throw new HttpException({ message: '用户名或密码错误' }, HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException({ message: '用户名或密码错误' }, HttpStatus.UNAUTHORIZED);
    }

    const token = await this.createToken({
      id: user.id,
      account: user.account,
    });

    await this.userRepository.update({ id: user.id }, { lastLoginTime: new Date() });

    return { id: user.id, token };
  }

  async createToken(userData: {
    id: number;
    account?: string;
    wxOpenid?: string;
  }): Promise<string> {
    return this.jwtService.sign(userData, {
      expiresIn: config.jwtSecret?.signOptions?.expiresIn || '7d',
    });
  }

  async validateToken(request: any): Promise<boolean> {
    const token = request.cookies['token'];
    const openid = request.cookies['openid'];

    if (!token) {
      throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
    }

    const tokenDecode = this.jwtService.decode(token) as Record<string, unknown> | null;
    if (!tokenDecode || !tokenDecode['id']) {
      throw new HttpException('无效的令牌，请重新登录', HttpStatus.UNAUTHORIZED);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExp = tokenDecode['exp'] as number;
    if (!tokenExp || currentTime >= tokenExp) {
      throw new HttpException('令牌已过期，请重新登录', HttpStatus.UNAUTHORIZED);
    }

    const cacheKey = `user:permission:${tokenDecode['id']}`;
    let userPermission: { apiRoutes: string[]; isDisable: boolean } | null = null;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        userPermission = JSON.parse(cached);
      }
    } catch {
      // 缓存读取失败，继续从数据库查询
    }

    if (!userPermission) {
      const user = await this.userRepository.findOne({
        where: { id: tokenDecode['id'] as number },
        relations: ['role'],
      });

      if (!user) {
        throw new HttpException('用户不存在，请重新登录', HttpStatus.UNAUTHORIZED);
      }

      if (user.isDisable) {
        throw new HttpException('账号已被禁用', HttpStatus.FORBIDDEN);
      }

      if (!user.role) {
        throw new HttpException('用户未分配角色，请联系管理员', HttpStatus.FORBIDDEN);
      }

      let apiRoutes: string[] = [];
      try {
        apiRoutes = user.role.apiRoutes ? JSON.parse(user.role.apiRoutes) : [];
      } catch {
        apiRoutes = [];
      }

      userPermission = { apiRoutes, isDisable: user.role.isDisable };

      try {
        await this.redis.setex(cacheKey, 300, JSON.stringify(userPermission));
      } catch {
        // 缓存写入失败不影响主流程
      }
    }

    if (userPermission.isDisable) {
      throw new HttpException('角色已被禁用', HttpStatus.FORBIDDEN);
    }

    const requestUrl = request.url.split('?')[0];
    const hasPermission = userPermission.apiRoutes.includes(requestUrl);
    if (!hasPermission) {
      throw new HttpException('您的账号没有此接口权限', HttpStatus.FORBIDDEN);
    }

    if (openid && openid === tokenDecode['wxOpenid']) {
      request.userId = tokenDecode['id'];
      return true;
    }

    const session = request.session;
    if (token === session?.user) {
      request.userId = tokenDecode['id'];
      return true;
    }

    throw new HttpException('会话验证失败，请重新登录', HttpStatus.UNAUTHORIZED);
  }

  async getLoginState(getLoginStateDto: GetLoginStateDto): Promise<any> {
    const weappLoginLogin = await this.redis.hget('weappLogin', getLoginStateDto.unique);
    if (!weappLoginLogin) {
      throw new HttpException(
        {
          message: `未查询到识别码为${getLoginStateDto.unique}人员`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return JSON.parse(weappLoginLogin);
  }

  async weappLogin(weappLoginDto: WeappLoginDto): Promise<LoginResult> {
    let user = await this.userRepository.findOne({
      where: { wxOpenid: weappLoginDto.openid, isDisable: false },
    });

    if (!user) {
      const role = await this.roleRepository.findOne({
        where: { name: '普通用户' },
      });
      if (!role) {
        throw new HttpException({ message: '默认角色不存在' }, HttpStatus.BAD_REQUEST);
      }
      user = await this.userRepository.save({
        ...weappLoginDto,
        role: role as RoleEntity,
        wxOpenid: weappLoginDto.openid,
        createTime: new Date(),
      });
    }

    const token = await this.createToken({
      id: user.id,
      wxOpenid: user.wxOpenid,
    });
    return { id: user.id, token };
  }

  async weappLoginToWeb(weappLoginToWebDto: WeappLoginToWebDto): Promise<any> {
    let user = await this.userRepository.findOne({
      where: { wxOpenid: weappLoginToWebDto.openid, isDisable: false },
    });

    if (!user) {
      const role = await this.roleRepository.findOne({
        where: { name: '普通用户' },
      });
      if (!role) {
        throw new HttpException({ message: '默认角色不存在' }, HttpStatus.BAD_REQUEST);
      }
      user = await this.userRepository.save({
        ...weappLoginToWebDto,
        role: role as RoleEntity,
        wxOpenid: weappLoginToWebDto.openid,
        createTime: new Date(),
      });
    }

    const token = await this.createToken({
      id: user.id,
      wxOpenid: user.wxOpenid,
    });
    await this.redis.hset('weappLogin', {
      [weappLoginToWebDto.unique]: JSON.stringify({ id: user.id, token }),
    });
    return true;
  }

  async getWeappAccessToken(): Promise<WeappAccessToken> {
    if (!config.weapp) {
      throw new HttpException({ message: '微信小程序配置不存在' }, HttpStatus.BAD_REQUEST);
    }
    const response = await this.requestService.getRequest(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.weapp.appId}&secret=${config.weapp.secret}`,
    );
    if (response.errcode) {
      throw new HttpException(
        { message: `微信小程序错误码${response.errcode}` },
        HttpStatus.BAD_REQUEST,
      );
    }
    return response;
  }

  async getWeappUserOpenid(getWeappUserOpenidDto: GetWeappUserOpenidDto): Promise<WeappUserInfo> {
    if (!config.weapp) {
      throw new HttpException({ message: '微信小程序配置不存在' }, HttpStatus.BAD_REQUEST);
    }
    const response = await this.requestService.getRequest(
      `https://api.weixin.qq.com/sns/jscode2session?js_code=${getWeappUserOpenidDto.code}&grant_type=authorization_code&appid=${config.weapp.appId}&secret=${config.weapp.secret}`,
    );
    if (response.errcode) {
      throw new HttpException(
        { message: `微信小程序错误码${response.errcode}` },
        HttpStatus.BAD_REQUEST,
      );
    }
    return response;
  }

  async getWeappCode(getWeappCodeDto: GetWeappCodeDto): Promise<unknown> {
    try {
      const isBase64 = getWeappCodeDto.type === 'base64';
      const imageBinary = await this.requestService.postRequest(
        `https://api.weixin.qq.com/wxa/getwxacode?access_token=${getWeappCodeDto.access_token}`,
        {
          path: getWeappCodeDto.path,
        },
        {
          responseType: isBase64 ? 'arraybuffer' : 'stream',
        },
      );
      if (imageBinary.errcode) {
        throw new HttpException(
          { message: `微信小程序错误码${imageBinary.errcode}` },
          HttpStatus.BAD_REQUEST,
        );
      }
      return isBase64
        ? `data:image/png;base64,${Buffer.from(imageBinary, 'utf-8').toString('base64')}`
        : createWeappCodeUrl(imageBinary, String(config.uploadDir));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { message: `生成小程序码失败，${(error as Error).message}` },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getWeappCodeToLogin(getWeappCodeToLoginDto: GetWeappCodeToLoginDto): Promise<unknown> {
    try {
      const isBase64 = getWeappCodeToLoginDto.type === 'base64';
      const imageBinary = await this.requestService.postRequest(
        `https://api.weixin.qq.com/wxa/getwxacode?access_token=${getWeappCodeToLoginDto.access_token}`,
        {
          path: getWeappCodeToLoginDto.path,
        },
        {
          responseType: isBase64 ? 'arraybuffer' : 'stream',
        },
      );
      if (imageBinary.errcode) {
        throw new HttpException(
          { message: `微信小程序错误码${imageBinary.errcode}` },
          HttpStatus.BAD_REQUEST,
        );
      }
      return isBase64
        ? `data:image/png;base64,${Buffer.from(imageBinary, 'utf-8').toString('base64')}`
        : createWeappCodeUrl(imageBinary, String(config.uploadDir));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { message: `生成小程序码失败，${(error as Error).message}` },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async invalidateUserPermissionCache(userId: number): Promise<void> {
    const cacheKey = `user:permission:${userId}`;
    await this.redis.del(cacheKey);
  }
}
