import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    required: true,
    description: '用户名',
    default: 'admin',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  readonly account: string;

  @ApiPropertyOptional({
    required: true,
    description: '密码',
    default: '888888',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  readonly password: string;
}

export class GetLoginStateDto {
  @ApiPropertyOptional({ description: '随机唯一标识' })
  readonly unique: string;
}

export class GetWeappUserOpenidDto {
  @ApiPropertyOptional({
    required: true,
    description: 'code',
    default: '',
  })
  @IsNotEmpty({ message: 'code不能为空' })
  readonly code: string;
}

export class WeappLoginDto extends GetWeappUserOpenidDto {
  @ApiPropertyOptional({
    description: 'openid',
    default: 'oKupX5MeeVRHDhUD31axXge4-nDw',
  })
  readonly openid?: string;

  readonly session_key?: string;
}

export class WeappLoginToWebDto extends GetWeappUserOpenidDto {
  @ApiPropertyOptional({ description: '随机唯一标识' })
  @IsNotEmpty({ message: '随机唯一标识不能为空' })
  readonly unique: string;

  @ApiPropertyOptional({
    description: 'openid',
    default: 'oKupX5MeeVRHDhUD31axXge4-nDw',
  })
  readonly openid?: string;

  readonly session_key?: string;
}

export class GetWeappCodeDto {
  @ApiPropertyOptional({
    description: '二维码类型',
    default: 'url',
  })
  readonly type: 'base64' | 'url';

  @ApiPropertyOptional({ description: 'access_token' })
  readonly access_token: string;

  @ApiPropertyOptional({ description: 'access_token' })
  readonly path: string;
}

export class GetWeappCodeToLoginDto extends GetWeappCodeDto {
  @ApiPropertyOptional({ description: '随机唯一标识' })
  @IsNotEmpty({ message: '随机唯一标识不能为空' })
  readonly unique: string;
}
