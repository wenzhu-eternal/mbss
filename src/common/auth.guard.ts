import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import config from '@config/config.default';
import UserService from '@/modules/user/user.service';

@Injectable()
export default class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('进入全局权限守卫 :>> ');
    const request = context.switchToHttp().getRequest();
    if (this.hasUrl(this.urlList, request.url.split('?')[0])) {
      return true;
    }

    return await this.userService.AuthService(request);
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
