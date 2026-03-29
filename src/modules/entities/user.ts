import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import RoleEntity from './role';

@Entity({ name: 'user' })
export default class UserEntity {
  @PrimaryGeneratedColumn({
    comment: '自增ID',
  })
  id: number;

  @Index()
  @Column({ nullable: true })
  account: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Index()
  @Column({ nullable: true })
  wxOpenid: string;

  @Column({ nullable: true, length: 11 })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @ManyToOne(() => RoleEntity, roleEntity => roleEntity.users)
  role: RoleEntity;

  @Column({ readonly: true })
  createTime: Date;

  @Column({ nullable: true })
  updateTime: Date;

  @Column({ nullable: true })
  lastLoginTime: Date;

  @Index()
  @Column({ comment: '禁用', default: false })
  isDisable: boolean;
}
