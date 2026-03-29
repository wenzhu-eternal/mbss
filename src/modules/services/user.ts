import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { getApiRoutesJson } from '@/common/apiRoutes';
import config from '@/config/config.default';

import { AddUserDto, PageDto, ToggleUserStatusDto, UpdateUserDto } from '../dtos/user';
import RoleEntity from '../entities/role';
import UserEntity from '../entities/user';

@Injectable()
export default class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async addUser(addUserDto: AddUserDto): Promise<boolean> {
    if (
      !!(await this.userRepository.findOne({
        where: { account: addUserDto.account },
      }))
    ) {
      throw new HttpException({ message: '用户名不能重复' }, HttpStatus.BAD_REQUEST);
    }
    const role = await this.roleRepository.findOneBy({
      id: addUserDto.roleId,
      isDisable: false,
    });
    if (!role) {
      throw new HttpException({ message: '角色不存在' }, HttpStatus.BAD_REQUEST);
    }
    try {
      const hashedPassword = addUserDto.password
        ? await bcrypt.hash(addUserDto.password, 10)
        : undefined;
      const { roleId: _roleId, ...restDto } = addUserDto;
      await this.userRepository.save({
        ...restDto,
        password: hashedPassword,
        role: role as RoleEntity,
        createTime: new Date(),
      });
      return true;
    } catch (error) {
      throw new HttpException(
        { message: (error as { sqlMessage: string }).sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findUsers(pageDto: PageDto): Promise<any> {
    const { page = 1, pageSize = 20 } = pageDto;
    const skip = (page - 1) * pageSize;
    try {
      const [users, total] = await this.userRepository.findAndCount({
        relations: ['role'],
        select: [
          'id',
          'account',
          'phone',
          'email',
          'isDisable',
          'createTime',
          'updateTime',
          'lastLoginTime',
          'role',
        ],
        skip,
        take: pageSize,
        order: { id: 'DESC' },
      });
      return {
        list: users.map(user => ({
          id: user.id,
          account: user.account,
          phone: user.phone,
          email: user.email,
          isDisable: user.isDisable,
          createTime: user.createTime,
          updateTime: user.updateTime,
          lastLoginTime: user.lastLoginTime,
          role: user.role ? { id: user.role.id, name: user.role.name } : null,
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new HttpException({ message: (error as Error).message }, HttpStatus.BAD_REQUEST);
    }
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<any> {
    if (!(await this.userRepository.findOneBy({ id: updateUserDto.id }))) {
      throw new HttpException({ message: '无此用户，请确认' }, HttpStatus.BAD_REQUEST);
    }
    const user = await this.userRepository.findOne({
      where: { account: updateUserDto.account },
    });
    if (!!user && user.id !== updateUserDto.id) {
      throw new HttpException({ message: '用户名不能重复' }, HttpStatus.BAD_REQUEST);
    }
    const role = await this.roleRepository.findOneBy({
      id: updateUserDto.roleId,
      isDisable: false,
    });
    if (!role) {
      throw new HttpException({ message: '角色不存在' }, HttpStatus.BAD_REQUEST);
    }
    try {
      const { roleId: _roleId, ...restDto } = updateUserDto;
      const updateData: Record<string, unknown> = {
        ...restDto,
        role: role as RoleEntity,
        updateTime: new Date(),
      };
      if (updateUserDto.password) {
        updateData.password = updateData.password
          ? await bcrypt.hash(updateUserDto.password, 10)
          : undefined;
      }
      await this.userRepository.update({ id: updateUserDto.id }, updateData);
      return true;
    } catch (error) {
      throw new HttpException(
        { message: (error as { sqlMessage: string }).sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async toggleUserStatus(toggleUserStatusDto: ToggleUserStatusDto): Promise<any> {
    const result = await this.userRepository.findOne({
      where: { id: toggleUserStatusDto.id },
    });
    if (!result) {
      throw new HttpException({ message: '无此用户，请确认' }, HttpStatus.BAD_REQUEST);
    }
    try {
      await this.userRepository.update(
        { id: toggleUserStatusDto.id },
        {
          isDisable: !result.isDisable,
          updateTime: new Date(),
        },
      );
      return true;
    } catch (error) {
      throw new HttpException({ message: (error as any).sqlMessage }, HttpStatus.BAD_REQUEST);
    }
  }

  async findApiRoutes(): Promise<string[]> {
    try {
      return JSON.parse(getApiRoutesJson());
    } catch (_error) {
      return [];
    }
  }

  async addAdmin(): Promise<boolean> {
    const account = config.admin?.account;
    const existingAdmin = await this.userRepository.findOne({
      where: { account },
    });
    if (existingAdmin) {
      throw new HttpException({ message: '管理员账号已存在' }, HttpStatus.BAD_REQUEST);
    }

    const role = await this.roleRepository.findOne({
      where: { name: '管理员', isDisable: false },
    });
    if (!role) {
      throw new HttpException(
        { message: '管理员角色不存在或已被禁用，请先创建角色' },
        HttpStatus.BAD_REQUEST,
      );
    }

    let password = config.admin?.defaultPassword;
    if (!password) {
      password = this.generateSecurePassword();
      this.logger.warn(
        `未配置管理员密码，已生成随机密码。请使用环境变量 ADMIN_DEFAULT_PASSWORD 配置固定密码。`,
      );
      this.logger.log(`管理员初始密码: ${password}`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await this.userRepository.save({
        account,
        password: hashedPassword,
        phone: '',
        email: '',
        role: role as RoleEntity,
        createTime: new Date(),
      });
      return true;
    } catch (error) {
      throw new HttpException(
        { message: (error as { sqlMessage: string }).sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async getCurrentUser(userId: number | undefined): Promise<any> {
    if (!userId) {
      throw new HttpException({ message: '用户未登录' }, HttpStatus.UNAUTHORIZED);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
      select: [
        'id',
        'account',
        'phone',
        'email',
        'isDisable',
        'createTime',
        'lastLoginTime',
        'role',
      ],
    });

    if (!user) {
      throw new HttpException({ message: '用户不存在' }, HttpStatus.NOT_FOUND);
    }

    if (user.isDisable) {
      throw new HttpException({ message: '账号已被禁用' }, HttpStatus.FORBIDDEN);
    }

    return {
      id: user.id,
      account: user.account,
      phone: user.phone,
      email: user.email,
      isDisable: user.isDisable,
      createTime: user.createTime,
      lastLoginTime: user.lastLoginTime,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
    };
  }
}
