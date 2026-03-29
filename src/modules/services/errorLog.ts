import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';

import {
  AddWhitelistDto,
  DeleteWhitelistDto,
  QueryErrorLogDto,
  ReportErrorDto,
  ResolveErrorDto,
  UpdateWhitelistDto,
} from '../dtos/errorLog';
import ErrorLogEntity from '../entities/errorLog';
import ErrorWhitelistEntity from '../entities/errorWhitelist';

interface ErrorLogListResult {
  list: ErrorLogEntity[];
  total: number;
  page: number;
  pageSize: number;
}

interface ErrorStats {
  total: number;
  unresolved: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
}

@Injectable()
export default class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);
  private whitelistCache: ErrorWhitelistEntity[] = [];
  private lastCacheTime = 0;
  private readonly cacheTTL = 60000;

  constructor(
    @InjectRepository(ErrorLogEntity)
    private readonly errorLogRepository: Repository<ErrorLogEntity>,
    @InjectRepository(ErrorWhitelistEntity)
    private readonly whitelistRepository: Repository<ErrorWhitelistEntity>,
  ) {}

  async reportError(dto: ReportErrorDto, ip?: string): Promise<boolean> {
    try {
      const isWhitelisted = await this.checkWhitelist(dto);
      if (isWhitelisted) {
        this.logger.debug(`错误已被白名单过滤: ${dto.message}`);
        return false;
      }

      const errorLog = this.errorLogRepository.create({
        ...dto,
        extra: {
          ...dto.extra,
          ip,
          reportedAt: new Date().toISOString(),
        },
        createTime: new Date(),
      });

      await this.errorLogRepository.save(errorLog);
      return true;
    } catch (error) {
      this.logger.error(`保存错误日志失败: ${(error as Error).message}`);
      return false;
    }
  }

  private async checkWhitelist(dto: ReportErrorDto): Promise<boolean> {
    await this.refreshWhitelistCache();

    for (const rule of this.whitelistCache) {
      if (!rule.isEnabled) {
        continue;
      }

      let targetValue: string | undefined;
      switch (rule.matchType) {
        case 'message':
          targetValue = dto.message;
          break;
        case 'url':
          targetValue = dto.url;
          break;
        case 'errorType':
          targetValue = dto.errorType;
          break;
        case 'file':
          targetValue = dto.file;
          break;
      }

      if (targetValue) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(targetValue)) {
            return true;
          }
        } catch {
          this.logger.warn(`白名单规则正则表达式无效: ${rule.pattern}`);
        }
      }
    }

    return false;
  }

  private async refreshWhitelistCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheTime > this.cacheTTL) {
      try {
        this.whitelistCache = await this.whitelistRepository.find({
          where: { isEnabled: true },
        });
        this.lastCacheTime = now;
      } catch (error) {
        this.logger.error(`刷新白名单缓存失败: ${(error as Error).message}`);
      }
    }
  }

  async getErrorLogList(dto: QueryErrorLogDto): Promise<ErrorLogListResult> {
    let { page = 1, pageSize = 20 } = dto;

    page = Math.max(1, Math.floor(page));
    pageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    const where: FindOptionsWhere<ErrorLogEntity> = {};

    if (dto.source) {
      where.source = dto.source;
    }

    if (dto.errorType) {
      where.errorType = dto.errorType;
    }

    where.isResolved = dto.isResolved === '1';

    if (dto.startTime && dto.endTime) {
      const startDate = new Date(dto.startTime);
      const endDate = new Date(dto.endTime);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        where.createTime = Between(startDate, endDate);
      }
    }

    try {
      let queryBuilder = this.errorLogRepository.createQueryBuilder('error_log');

      if (dto.keyword) {
        const escapedKeyword = dto.keyword.replace(/[%_]/g, '\\$&');
        queryBuilder = queryBuilder
          .where('error_log.message LIKE :keyword', { keyword: `%${escapedKeyword}%` })
          .orWhere('error_log.stack LIKE :keyword', { keyword: `%${escapedKeyword}%` });
      }

      if (where.source) {
        queryBuilder = queryBuilder.andWhere('error_log.source = :source', {
          source: where.source,
        });
      }
      if (where.errorType) {
        queryBuilder = queryBuilder.andWhere('error_log.errorType = :errorType', {
          errorType: where.errorType,
        });
      }
      if (where.isResolved !== undefined) {
        queryBuilder = queryBuilder.andWhere('error_log.isResolved = :isResolved', {
          isResolved: where.isResolved,
        });
      }
      if (where.createTime) {
        queryBuilder = queryBuilder.andWhere(
          'error_log.createTime BETWEEN :startTime AND :endTime',
          {
            startTime: (where.createTime as unknown as { _value: [Date, Date] })._value?.[0],
            endTime: (where.createTime as unknown as { _value: [Date, Date] })._value?.[1],
          },
        );
      }

      const [list, total] = await queryBuilder
        .orderBy('error_log.createTime', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error(`查询错误日志列表失败: ${(error as Error).message}`);
      return { list: [], total: 0, page, pageSize };
    }
  }

  async getErrorLogById(id: number): Promise<ErrorLogEntity> {
    if (!id || id <= 0) {
      throw new HttpException({ message: '无效的错误日志ID' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const errorLog = await this.errorLogRepository.findOne({ where: { id } });
      if (!errorLog) {
        throw new HttpException({ message: '错误日志不存在' }, HttpStatus.NOT_FOUND);
      }
      return errorLog;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`获取错误日志详情失败: ${(error as Error).message}`);
      throw new HttpException(
        { message: '获取错误日志详情失败' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resolveError(dto: ResolveErrorDto, userId: number): Promise<boolean> {
    if (!dto.id || dto.id <= 0) {
      throw new HttpException({ message: '无效的错误日志ID' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const errorLog = await this.errorLogRepository.findOne({ where: { id: dto.id } });
      if (!errorLog) {
        throw new HttpException({ message: '错误日志不存在' }, HttpStatus.NOT_FOUND);
      }

      if (errorLog.isResolved) {
        throw new HttpException({ message: '该错误已处理' }, HttpStatus.BAD_REQUEST);
      }

      await this.errorLogRepository.update(
        { id: dto.id },
        {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: userId,
        },
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`标记错误处理失败: ${(error as Error).message}`);
      throw new HttpException({ message: '标记错误处理失败' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getErrorStats(): Promise<ErrorStats> {
    try {
      const total = await this.errorLogRepository.count();
      const unresolved = await this.errorLogRepository.count({
        where: { isResolved: false },
      });

      const sourceStats = await this.errorLogRepository
        .createQueryBuilder('error_log')
        .select('error_log.source', 'source')
        .addSelect('COUNT(*)', 'count')
        .groupBy('error_log.source')
        .getRawMany();

      const typeStats = await this.errorLogRepository
        .createQueryBuilder('error_log')
        .select('error_log.errorType', 'errorType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('error_log.errorType')
        .getRawMany();

      return {
        total,
        unresolved,
        bySource: sourceStats.reduce(
          (acc, item) => {
            acc[item.source] = parseInt(item.count) || 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byType: typeStats.reduce(
          (acc, item) => {
            acc[item.errorType] = parseInt(item.count) || 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    } catch (error) {
      this.logger.error(`获取错误统计失败: ${(error as Error).message}`);
      return {
        total: 0,
        unresolved: 0,
        bySource: {},
        byType: {},
      };
    }
  }

  async getWhitelist(): Promise<ErrorWhitelistEntity[]> {
    try {
      return await this.whitelistRepository.find({
        order: { createTime: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`获取白名单列表失败: ${(error as Error).message}`);
      return [];
    }
  }

  async addWhitelist(dto: AddWhitelistDto): Promise<ErrorWhitelistEntity> {
    try {
      new RegExp(dto.pattern, 'i');
    } catch {
      throw new HttpException({ message: '正则表达式格式无效' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const whitelist = this.whitelistRepository.create({
        ...dto,
        createTime: new Date(),
      });

      const saved = await this.whitelistRepository.save(whitelist);
      this.lastCacheTime = 0;
      return saved;
    } catch (error) {
      this.logger.error(`添加白名单规则失败: ${(error as Error).message}`);
      throw new HttpException({ message: '添加白名单规则失败' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateWhitelist(dto: UpdateWhitelistDto): Promise<boolean> {
    const whitelist = await this.whitelistRepository.findOne({ where: { id: dto.id } });
    if (!whitelist) {
      throw new HttpException({ message: '白名单规则不存在' }, HttpStatus.NOT_FOUND);
    }

    try {
      new RegExp(dto.pattern, 'i');
    } catch {
      throw new HttpException({ message: '正则表达式格式无效' }, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.whitelistRepository.update(
        { id: dto.id },
        {
          ...dto,
          updateTime: new Date(),
        },
      );

      this.lastCacheTime = 0;
      return true;
    } catch (error) {
      this.logger.error(`更新白名单规则失败: ${(error as Error).message}`);
      throw new HttpException({ message: '更新白名单规则失败' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteWhitelist(dto: DeleteWhitelistDto): Promise<boolean> {
    const whitelist = await this.whitelistRepository.findOne({ where: { id: dto.id } });
    if (!whitelist) {
      throw new HttpException({ message: '白名单规则不存在' }, HttpStatus.NOT_FOUND);
    }

    try {
      await this.whitelistRepository.delete({ id: dto.id });
      this.lastCacheTime = 0;
      return true;
    } catch (error) {
      this.logger.error(`删除白名单规则失败: ${(error as Error).message}`);
      throw new HttpException({ message: '删除白名单规则失败' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
