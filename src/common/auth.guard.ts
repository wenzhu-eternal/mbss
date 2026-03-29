import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

import config from '@/config/config.default';
import AuthService from '@/modules/services/auth';

@Injectable()
export default class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('进入全局权限守卫');
    const request = context.switchToHttp().getRequest();
    if (this.hasUrl(this.urlList, request.url.split('?')[0])) {
      return true;
    }

    return await this.authService.validateToken(request);
  }

  private urlList: string[] = config.routerWhitelist || [];

  private hasUrl(urlList: string[], url: string): boolean {
    let flag = false;
    if (urlList.some(newUrl => url.startsWith(`/api/${newUrl}`))) {
      flag = true;
    }
    return flag;
  }
}
