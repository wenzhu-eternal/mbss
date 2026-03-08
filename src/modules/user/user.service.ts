import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getApiRoutesJson } from '@/common/apiRoutes';
import {
  AddRoleDto,
  AddUserDto,
  ToggleRoleStatusDto,
  ToggleUserStatusDto,
  GetRolesDto,
  GetUsersDto,
  LoginDto,
  UpdateRoleDto,
  UpdateUserDto,
} from './user.dto';
import UserEntity from './user.entity';
import RoleEntity from './role.entity';

@Injectable()
export default class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async addUser(addUserDto: AddUserDto): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { account: addUserDto.account },
    });
    if (existingUser) {
      this.logger.warn(`用户名 ${addUserDto.account} 已存在`);
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepository.findOneBy({
      id: addUserDto.role,
    });
    if (!role) {
      this.logger.warn(`角色 ID ${addUserDto.role} 不存在`);
      throw new HttpException(
        { message: '角色不存在' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(
        addUserDto.password,
        this.SALT_ROUNDS,
      );
      await this.userRepository.save({
        ...addUserDto,
        password: hashedPassword,
        role,
        createTime: new Date(),
      });
      this.logger.log(`用户 ${addUserDto.account} 创建成功`);
      return true;
    } catch (error) {
      this.logger.error(`创建用户失败: ${error.message}`);
      throw new HttpException(
        { message: '创建用户失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findUsers({ page = 1, pageSize = 10 }: GetUsersDto): Promise<any> {
    try {
      const total = await this.userRepository.count();
      const result = await this.userRepository.find({
        skip: (page - 1) * pageSize,
        take: pageSize,
        cache: true,
        relations: ['role'],
      });

      return {
        total,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        list: result.map(({ password, ...user }) => user),
      };
    } catch (error) {
      this.logger.error(`查询用户列表失败: ${error.message}`);
      throw new HttpException(
        { message: '查询用户列表失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<boolean> {
    const existingUser = await this.userRepository.findOneBy({
      id: updateUserDto.id,
    });
    if (!existingUser) {
      this.logger.warn(`用户 ID ${updateUserDto.id} 不存在`);
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const duplicateUser = await this.userRepository.findOne({
      where: { account: updateUserDto.account },
    });
    if (duplicateUser && duplicateUser.id !== updateUserDto.id) {
      this.logger.warn(`用户名 ${updateUserDto.account} 已被其他用户使用`);
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepository.findOneBy({
      id: updateUserDto.role,
    });
    if (!role) {
      this.logger.warn(`角色 ID ${updateUserDto.role} 不存在`);
      throw new HttpException(
        { message: '角色不存在' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const updateData: any = {
        ...updateUserDto,
        role,
        updateTime: new Date(),
      };

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(
          updateUserDto.password,
          this.SALT_ROUNDS,
        );
      } else {
        delete updateData.password;
      }

      await this.userRepository.update({ id: updateUserDto.id }, updateData);
      this.logger.log(`用户 ID ${updateUserDto.id} 更新成功`);
      return true;
    } catch (error) {
      this.logger.error(`更新用户失败: ${error.message}`);
      throw new HttpException(
        { message: '更新用户失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async toggleUserStatus(
    toggleUserStatusDto: ToggleUserStatusDto,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: toggleUserStatusDto.id },
    });
    if (!user) {
      this.logger.warn(`用户 ID ${toggleUserStatusDto.id} 不存在`);
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.userRepository.update(
        { id: toggleUserStatusDto.id },
        {
          isDisable: !user.isDisable,
          updateTime: new Date(),
        },
      );
      this.logger.log(
        `用户 ID ${toggleUserStatusDto.id} 状态已切换为 ${!user.isDisable}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`切换用户状态失败: ${error.message}`);
      throw new HttpException(
        { message: '切换用户状态失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findApiRoutes(): Promise<string[]> {
    try {
      return JSON.parse(getApiRoutesJson());
    } catch {
      return [];
    }
  }

  async addRole(addRoleDto: AddRoleDto): Promise<boolean> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: addRoleDto.name },
    });
    if (existingRole) {
      this.logger.warn(`角色名 ${addRoleDto.name} 已存在`);
      throw new HttpException(
        { message: '权限名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.roleRepository.save({
        name: addRoleDto.name,
        apiRoutes: JSON.stringify(addRoleDto.apiRoutes),
        createTime: new Date(),
      });
      this.logger.log(`角色 ${addRoleDto.name} 创建成功`);
      return true;
    } catch (error) {
      this.logger.error(`创建角色失败: ${error.message}`);
      throw new HttpException(
        { message: '创建角色失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findRoles({ page = 1, pageSize = 10 }: GetRolesDto): Promise<any> {
    try {
      const total = await this.roleRepository.count();
      const result = await this.roleRepository.find({
        skip: (page - 1) * pageSize,
        take: pageSize,
        cache: true,
      });

      return {
        total,
        list: result,
      };
    } catch (error) {
      this.logger.error(`查询角色列表失败: ${error.message}`);
      throw new HttpException(
        { message: '查询角色列表失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateRole(updateRoleDto: UpdateRoleDto): Promise<boolean> {
    const existingRole = await this.roleRepository.findOneBy({
      id: updateRoleDto.id,
    });
    if (!existingRole) {
      this.logger.warn(`角色 ID ${updateRoleDto.id} 不存在`);
      throw new HttpException(
        { message: '无此权限，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const duplicateRole = await this.roleRepository.findOne({
      where: { name: updateRoleDto.name },
    });
    if (duplicateRole && duplicateRole.id !== updateRoleDto.id) {
      this.logger.warn(`角色名 ${updateRoleDto.name} 已被其他角色使用`);
      throw new HttpException(
        { message: '权限名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.roleRepository.update(
        { id: updateRoleDto.id },
        {
          name: updateRoleDto.name,
          apiRoutes: JSON.stringify(updateRoleDto.apiRoutes),
          updateTime: new Date(),
        },
      );
      this.logger.log(`角色 ID ${updateRoleDto.id} 更新成功`);
      return true;
    } catch (error) {
      this.logger.error(`更新角色失败: ${error.message}`);
      throw new HttpException(
        { message: '更新角色失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async toggleRoleStatus(
    toggleRoleStatusDto: ToggleRoleStatusDto,
  ): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id: toggleRoleStatusDto.id },
    });
    if (!role) {
      this.logger.warn(`角色 ID ${toggleRoleStatusDto.id} 不存在`);
      throw new HttpException(
        { message: '无此权限，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.roleRepository.update(
        { id: toggleRoleStatusDto.id },
        {
          isDisable: !role.isDisable,
          updateTime: new Date(),
        },
      );
      this.logger.log(
        `角色 ID ${toggleRoleStatusDto.id} 状态已切换为 ${!role.isDisable}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`切换角色状态失败: ${error.message}`);
      throw new HttpException(
        { message: '切换角色状态失败' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: {
        account: loginDto.account,
        isDisable: false,
      },
      relations: ['role'],
    });

    if (!user) {
      this.logger.warn(`用户 ${loginDto.account} 登录失败`);
      throw new HttpException({ message: '查无此人' }, HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(`用户 ${loginDto.account} 密码错误`);
      throw new HttpException({ message: '密码错误' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const token = await this.createToken({
        id: user.id,
        account: user.account,
      });
      await this.userRepository.update(
        { id: user.id },
        {
          lastLoginTime: new Date(),
        },
      );
      this.logger.log(`用户 ${loginDto.account} 登录成功`);
      return { id: user.id, token };
    } catch (error) {
      this.logger.error(`登录失败: ${error.message}`);
      throw new HttpException({ message: '登录失败' }, HttpStatus.BAD_REQUEST);
    }
  }

  async createToken(userData): Promise<any> {
    return this.jwtService.sign(userData);
  }

  async authService(request): Promise<boolean> {
    const token = request.cookies['token'];
    const tokenDecode = (await this.jwtService.decode(token)) || {};
    const user = await this.userRepository.findOne({
      where: { id: tokenDecode['id'] },
      relations: ['role'],
    });

    if (!user || !user.role) {
      this.logger.warn(`用户认证失败: 用户或角色不存在`);
      throw new HttpException('您的账号没有此接口权限', HttpStatus.BAD_REQUEST);
    }

    const apiRoutes: string[] = JSON.parse(user.role.apiRoutes || '[]');
    const isAuth = apiRoutes.includes(request.url.split('?')[0]);
    if (!isAuth) {
      this.logger.warn(`用户 ${user.account} 无权限访问 ${request.url}`);
      throw new HttpException('您的账号没有此接口权限', HttpStatus.BAD_REQUEST);
    }

    const session = request.session;
    const currentTime = new Date().getTime() / 1000;

    if (token === session.user && currentTime < tokenDecode['exp']) {
      return true;
    }

    this.logger.warn(`用户 ${user.account} 认证失败: Token 无效或已过期`);
    throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
  }
}
