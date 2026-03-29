import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MatchType = 'message' | 'url' | 'errorType' | 'file';

@Entity({ name: 'error_whitelist' })
export default class ErrorWhitelistEntity {
  @PrimaryGeneratedColumn({
    comment: '自增ID',
  })
  id: number;

  @Column({
    comment: '规则名称',
    length: 100,
  })
  name: string;

  @Column({
    comment: '匹配类型',
    length: 20,
  })
  matchType: MatchType;

  @Column({
    comment: '匹配模式（正则表达式）',
    length: 500,
  })
  pattern: string;

  @Column({
    comment: '是否启用',
    default: true,
  })
  isEnabled: boolean;

  @Column({
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string;

  @Column({
    readonly: true,
    comment: '创建时间',
  })
  createTime: Date;

  @Column({
    nullable: true,
    comment: '更新时间',
  })
  updateTime: Date;
}
