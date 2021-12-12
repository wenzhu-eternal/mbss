import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn({
    comment: '自增ID'
  })
  id: number;

  @Column({})
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 11 })
  phone: string;

  @Column()
  emil: string;

  @Column({ readonly: true })
  createTime: Date;

  @Column({ nullable: true })
  socketId: string;

  @Column({ nullable: true })
  updataTime: Date;

  @Column({ nullable: true })
  lastLoginToken: string;

  @Column({ nullable: true })
  lastLoginTime: Date;

  @Column({ comment: '禁用', default: false })
  isDisable: boolean;
}