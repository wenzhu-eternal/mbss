import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import UserEntity from './user.entity';

@Entity({ name: 'role' })
export default class RoleEntity {
  @PrimaryGeneratedColumn({
    comment: '自增ID',
  })
  id: number;

  @Column({})
  name: string;

  @Column({ type: 'text' })
  apiRoutes: string;

  @OneToMany(() => UserEntity, (userEntity) => userEntity.role)
  users: UserEntity[];

  @Column({ readonly: true })
  createTime: Date;

  @Column({ nullable: true })
  updataTime: Date;

  @Column({ comment: '禁用', default: false })
  isDisable: boolean;
}
