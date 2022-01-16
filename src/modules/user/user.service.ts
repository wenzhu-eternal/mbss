import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AddUserDto,
  EDUserDto,
  GetUsersDto,
  LoginDto,
  UpdataUserDto,
} from './user.dto';
import UserEntity from './user.entity';

@Injectable()
export default class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async addUser(addUserDto: AddUserDto): Promise<boolean> {
    if (
      !!(await this.userRepository.findOne({ username: addUserDto.username }))
    ) {
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.userRepository.save({
        ...addUserDto,
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
    if (!(await this.userRepository.findByIds([updataUserDto])).length) {
      throw new HttpException(
        { message: '无此用户，请确认' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.userRepository.findOne({
      username: updataUserDto.username,
    });
    if (!!user && user.id !== updataUserDto.id) {
      throw new HttpException(
        { message: '用户名不能重复' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.userRepository.update(
        { id: updataUserDto.id },
        {
          ...updataUserDto,
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
    const result = await this.userRepository.findOne({ id: edUsersDto.id });
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

  async login(loginDto: LoginDto): Promise<any> {
    const result = await this.userRepository.findOne({
      username: loginDto.username,
      password: loginDto.password,
      isDisable: false,
    });
    if (result) {
      try {
        const token = await this.creatToken({
          id: result.id,
          username: result.username,
        });
        await this.userRepository.update(
          { id: result.id },
          {
            lastLoginToken: token,
            lastLoginTime: new Date(),
          },
        );
        return token;
      } catch (error) {
        throw new HttpException(
          { message: error.sqlMessage },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return false;
  }

  async verifiLogin(token: string): Promise<any> {
    const tokenDecode = await this.jwtService.decode(token);
    try {
      const user = await this.userRepository.findOne({ id: tokenDecode['id'] });
      if (
        user.lastLoginToken === token &&
        new Date().getTime() / 1000 < tokenDecode['exp']
      ) {
        return true;
      }
      throw new HttpException('没有授权，请先登录', HttpStatus.UNAUTHORIZED);
    } catch (error) {
      throw new HttpException(
        { message: error.sqlMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async loginOut(token: string): Promise<any> {
    try {
      await this.userRepository.update(
        { id: await this.jwtService.decode(token)['id'] },
        {
          lastLoginToken: null,
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

  async creatToken(userData): Promise<any> {
    return this.jwtService.sign(userData);
  }

  onSocketID(token: string, socketId?: string): void {
    try {
      this.userRepository.update(
        { lastLoginToken: token },
        {
          socketId: socketId || null,
        },
      );
    } catch (error) {}
  }
}
