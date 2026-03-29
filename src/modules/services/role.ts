import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getApiRoutesJson } from '@/common/apiRoutes';

import { AddRoleDto, PageDto, ToggleRoleStatusDto, UpdateRoleDto } from '../dtos/role';
import RoleEntity from '../entities/role';

@Injectable()
export default class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async addRole(addRoleDto: AddRoleDto): Promise<RoleEntity> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: addRoleDto.name },
    });
    if (existingRole) {
      throw new HttpException({ message: '权限名不能重复' }, HttpStatus.BAD_REQUEST);
    }

    return this.roleRepository.save({
      name: addRoleDto.name,
      apiRoutes: JSON.stringify(addRoleDto.apiRoutes),
      createTime: new Date(),
    });
  }

  async findRoles(pageDto: PageDto) {
    const { page = 1, pageSize = 20 } = pageDto;
    const skip = (page - 1) * pageSize;

    const [roles, total] = await this.roleRepository.findAndCount({
      skip,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return { list: roles, total, page, pageSize };
  }

  async updateRole(updateRoleDto: UpdateRoleDto): Promise<boolean> {
    const role = await this.roleRepository.findOneBy({ id: updateRoleDto.id });
    if (!role) {
      throw new HttpException({ message: '无此角色，请确认' }, HttpStatus.BAD_REQUEST);
    }

    const existingRole = await this.roleRepository.findOne({
      where: { name: updateRoleDto.name },
    });
    if (existingRole && existingRole.id !== updateRoleDto.id) {
      throw new HttpException({ message: '角色名不能重复' }, HttpStatus.BAD_REQUEST);
    }

    await this.roleRepository.update(
      { id: updateRoleDto.id },
      {
        name: updateRoleDto.name,
        apiRoutes: JSON.stringify(updateRoleDto.apiRoutes),
        updateTime: new Date(),
      },
    );

    return true;
  }

  async toggleRoleStatus(toggleRoleStatusDto: ToggleRoleStatusDto): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id: toggleRoleStatusDto.id },
    });
    if (!role) {
      throw new HttpException({ message: '无此权限，请确认' }, HttpStatus.BAD_REQUEST);
    }

    await this.roleRepository.update(
      { id: toggleRoleStatusDto.id },
      { isDisable: !role.isDisable, updateTime: new Date() },
    );

    return true;
  }

  async getApiRoutes(): Promise<string[]> {
    try {
      return JSON.parse(getApiRoutesJson());
    } catch {
      return [];
    }
  }
}
