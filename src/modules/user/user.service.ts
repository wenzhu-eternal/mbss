import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getApiRoutesJson } from '@/common/apiRoutes';
import {
  AddRoleDto,
  AddUserDto,
  EDRoleDto,
  EDUserDto,
  GetRolesDto,
  GetUsersDto,
  LoginDto,
  UpdataRoleDto,
  UpdataUserDto,
} from './user.dto';
import UserEntity from './user.entity';
import RoleEntity from './role.entity';

@Injectable()
export default class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async addUser(addUserDto: AddUserDto): Promise<boolean> {
    if (
      !!(await this.userRepository.findOne({
        where: { account: addUserDto.account },
      }))
    ) {
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const role = await this.roleRepository.findOneBy({
      id: addUserDto.role,
    });
    try {
      await this.userRepository.save({
        ...addUserDto,
        role,
        createTime: new Date(),
      });
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
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
        list: result.map((i) => {
          delete i.password;
          return i;
        }),
      };
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updataUser(updataUserDto: UpdataUserDto): Promise<any> {
    if (!(await this.userRepository.findOneBy({ id: updataUserDto.id }))) {
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.userRepository.findOne({
      where: { account: updataUserDto.account },
    });
    if (!!user && user.id !== updataUserDto.id) {
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const role = await this.roleRepository.findOneBy({
      id: updataUserDto.role,
    });
    try {
      await this.userRepository.update(
        { id: updataUserDto.id },
        {
          ...updataUserDto,
          role,
          updataTime: new Date(),
        },
      );
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async edUser(edUsersDto: EDUserDto): Promise<any> {
    const result = await this.userRepository.findOne({
      where: { id: edUsersDto.id },
    });
    if (!result) {
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.userRepository.update(
        { id: edUsersDto.id },
        {
          isDisable: !result.isDisable,
          updataTime: new Date(),
        },
      );
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findApiRoutes(): Promise<string[]> {
    try {
      return JSON.parse(getApiRoutesJson());
    } catch (error) {
      return [];
    }
  }

  async addRole(addRoleDto: AddRoleDto): Promise<boolean> {
    if (
      !!(await this.roleRepository.findOne({
        where: { name: addRoleDto.name },
      }))
    ) {
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
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
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
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updataRole(updataRoleDto: UpdataRoleDto): Promise<any> {
    if (!(await this.roleRepository.findOneBy({ id: updataRoleDto.id }))) {
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const Role = await this.roleRepository.findOne({
      where: { name: updataRoleDto.name },
    });
    if (!!Role && Role.id !== updataRoleDto.id) {
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.roleRepository.update(
        { id: updataRoleDto.id },
        {
          name: updataRoleDto.name,
          apiRoutes: JSON.stringify(updataRoleDto.apiRoutes),
          updataTime: new Date(),
        },
      );
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async edRole(edRolesDto: EDRoleDto): Promise<any> {
    const result = await this.roleRepository.findOne({
      where: { id: edRolesDto.id },
    });
    if (!result) {
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.roleRepository.update(
        { id: edRolesDto.id },
        {
          isDisable: !result.isDisable,
          updataTime: new Date(),
        },
      );
      return true;
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    const result = await this.userRepository.findOne({
      where: {
        account: loginDto.account,
        password: loginDto.password,
        isDisable: false,
      },
    });
    if (result) {
      try {
        const token = await this.creatToken({
          id: result.id,
          account: result.account,
        });
        await this.userRepository.update(
          { id: result.id },
          {
            lastLoginTime: new Date(),
          },
        );
        return { id: result.id, token };
      } catch (error) {
        throw new HttpException(
          { message: error.sqlMessage },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return false;
  }

  async creatToken(userData): Promise<any> {
    return this.jwtService.sign(userData);
  }

  async AuthService(request): Promise<boolean> {
    const token = request.cookies['token'];
    const tokenDecode = (await this.jwtService.decode(token)) || {};
    const user = await this.userRepository.findOne({
      where: { id: tokenDecode['id'] },
      relations: ['role'],
    });
    const isAuth = user.role.apiRoutes.includes(request.url.split('?')[0]);
    if (!isAuth)
      throw new HttpException('您的账号没有此接口权限', HttpStatus.BAD_REQUEST);

    const session = request.session;
    const currentTime = new Date().getTime() / 1000;

    if (token === session.user && currentTime < tokenDecode['exp']) return true;
    throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
  }
}
