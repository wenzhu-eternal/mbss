import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import config from '@config/config.default';

@Injectable()
export default class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('进入全局权限守卫 :>> ');
    const request = context.switchToHttp().getRequest();
    if (this.hasUrl(this.urlList, request.url.split('?')[0])) {
      return true;
    }

    const token = request.cookies['token'];
    const session = request.session;
    const tokenDecode = await this.jwtService.decode(token);
    const currentTime = new Date().getTime() / 1000;

    if (token === session.user && currentTime < tokenDecode['exp']) return true;
    throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
  }

  private urlList: string[] = config.routerWhitelist;

  private hasUrl(urlList: string[], url: string): boolean {
    let flag = false;
    if (urlList.some((newUrl) => url.startsWith(`/api/${newUrl}`))) {
      flag = true;
    }
    return flag;
  }
}
