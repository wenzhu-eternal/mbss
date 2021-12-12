import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export default class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.log('进入全局异常过滤器 :>> ');
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception.message ||
      exception.message.message ||
      exception.message.error || null;
    const mesLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: '请求失败',
      data: message,
    };

    Logger.error(
      '错误信息',
      JSON.stringify(mesLog),
      'HttpExceptionFilter'
    );
    response.status(HttpStatus.OK).json(mesLog);
  }
}