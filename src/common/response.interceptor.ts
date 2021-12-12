import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export default class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    console.log('进入全局响应拦截器 :>> ');
    return next.handle().pipe(
      map(data => {
        console.log('全局响应拦截器方法返回内容后 :>> ');
        return {
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: '请求成功',
          data: data,
        }
      })
    )
  }
}