import { UserService } from "@/modules/user/user.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import jwtSecret from "@/config/jwtSecret";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) { }

  async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {
    console.log('进入全局权限守卫 :>> ');
    const request = context.switchToHttp().getRequest();
    if (this.hasUrl(this.urlList, request.url.split('?')[0])) {
      return true;
    }

    const token = request.header('x-auth-token');
    if (token) {
      try {
        return await this.userService.verifiLogin(token);
      } catch { };
    }
    throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
  }

  private urlList: string[] = jwtSecret.routerWhitelist

  private hasUrl(urlList: string[], url: string): boolean {
    let flag = false;
    if (urlList.indexOf(url) >= 0) {
      flag = true;
    }
    return flag;
  }
}