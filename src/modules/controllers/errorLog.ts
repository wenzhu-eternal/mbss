import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import {
  AddWhitelistDto,
  DeleteWhitelistDto,
  QueryErrorLogDto,
  ReportErrorDto,
  ResolveErrorDto,
  UpdateWhitelistDto,
} from '../dtos/errorLog';
import ErrorLogService from '../services/errorLog';

@ApiTags('错误日志')
@Controller('error-log')
export default class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @ApiOperation({ summary: '上报错误' })
  @Post('reportError')
  async reportError(@Body() dto: ReportErrorDto, @Req() req: Request): Promise<unknown> {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.errorLogService.reportError(dto, ip);
    return { success: result };
  }

  @ApiOperation({ summary: '获取错误日志列表' })
  @Get('getErrorLogList')
  async getErrorLogList(@Query() dto: QueryErrorLogDto): Promise<unknown> {
    return await this.errorLogService.getErrorLogList(dto);
  }

  @ApiOperation({ summary: '获取错误日志详情' })
  @Get('getErrorLogDetail')
  async getErrorLogDetail(@Query('id') id: number): Promise<unknown> {
    return await this.errorLogService.getErrorLogById(id);
  }

  @ApiOperation({ summary: '标记错误已处理' })
  @Post('resolveError')
  async resolveError(
    @Body() dto: ResolveErrorDto,
    @Req() req: Request & { userId?: number },
  ): Promise<unknown> {
    return await this.errorLogService.resolveError(dto, req.userId || 0);
  }

  @ApiOperation({ summary: '获取错误统计' })
  @Get('getErrorStats')
  async getErrorStats(): Promise<unknown> {
    return await this.errorLogService.getErrorStats();
  }

  @ApiOperation({ summary: '获取白名单列表' })
  @Get('getWhitelist')
  async getWhitelist(): Promise<unknown> {
    return await this.errorLogService.getWhitelist();
  }

  @ApiOperation({ summary: '新增白名单规则' })
  @Post('addWhitelist')
  async addWhitelist(@Body() dto: AddWhitelistDto): Promise<unknown> {
    return await this.errorLogService.addWhitelist(dto);
  }

  @ApiOperation({ summary: '更新白名单规则' })
  @Post('updateWhitelist')
  async updateWhitelist(@Body() dto: UpdateWhitelistDto): Promise<unknown> {
    return await this.errorLogService.updateWhitelist(dto);
  }

  @ApiOperation({ summary: '删除白名单规则' })
  @Post('deleteWhitelist')
  async deleteWhitelist(@Body() dto: DeleteWhitelistDto): Promise<unknown> {
    return await this.errorLogService.deleteWhitelist(dto);
  }
}
