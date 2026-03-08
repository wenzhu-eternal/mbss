import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import config from '@config/config.default';
import UserService from '@/modules/user/user.service';

@Injectable()
export default class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('进入全局权限守卫 :>> ');
    const request = context.switchToHttp().getRequest();
    const url = request.url.split('?')[0];

    if (this.isWhitelisted(url)) {
      return true;
    }

    return await this.userService.authService(request);
  }

  private readonly urlList: string[] = config.routerWhitelist;

  private isWhitelisted(url: string): boolean {
    return this.urlList.some((whitelistUrl) =>
      url.startsWith(`/api/${whitelistUrl}`),
    );
  }
}
