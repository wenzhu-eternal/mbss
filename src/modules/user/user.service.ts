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
      !!(await this.userRepository.findOne({ account: addUserDto.account }))
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
      account: updataUserDto.account,
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
      account: loginDto.account,
      password: loginDto.password,
      isDisable: false,
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

  onSocketID(userId: number, socketId?: string): void {
    try {
      this.userRepository.update(
        { id: userId },
        {
          socketId: socketId,
        },
      );
    } catch (error) {}
  }
}
