import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ErrorSource = 'frontend' | 'backend' | 'taro';
export type ErrorType =
  | 'js_error'
  | 'http_error'
  | 'unhandled_promise'
  | 'resource_error'
  | 'api_error';

@Entity({ name: 'error_log' })
export default class ErrorLogEntity {
  @PrimaryGeneratedColumn({
    comment: '自增ID',
  })
  id: number;

  @Index()
  @Column({
    comment: '错误来源',
    length: 20,
    type: 'varchar',
  })
  source: ErrorSource;

  @Index()
  @Column({
    comment: '错误类型',
    length: 50,
  })
  errorType: string;

  @Column({
    type: 'text',
    comment: '错误消息',
  })
  message: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '错误堆栈',
  })
  stack: string;

  @Column({
    nullable: true,
    comment: '发生文件',
    length: 500,
  })
  file: string;

  @Column({
    nullable: true,
    comment: '行号',
    type: 'int',
  })
  line: number;

  @Column({
    nullable: true,
    comment: '列号',
    type: 'int',
  })
  column: number;

  @Column({
    nullable: true,
    comment: '请求URL',
    length: 500,
  })
  url: string;

  @Column({
    nullable: true,
    comment: '请求方法',
    length: 10,
  })
  method: string;

  @Column({
    nullable: true,
    comment: 'HTTP状态码',
    type: 'int',
  })
  statusCode: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: '额外数据',
  })
  extra: Record<string, unknown>;

  @Index()
  @Column({
    comment: '是否已处理',
    default: false,
  })
  isResolved: boolean;

  @Column({
    nullable: true,
    comment: '处理时间',
  })
  resolvedAt: Date;

  @Column({
    nullable: true,
    comment: '处理人',
  })
  resolvedBy: number;

  @Index()
  @Column({
    readonly: true,
    comment: '创建时间',
  })
  createTime: Date;
}
