import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import config from '@/config/config.default';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { join } from 'path';
import { FileUploadDto } from './file.dto';

@ApiTags('文件')
@Controller('file')
export default class FileController {
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '请上传文件',
    type: FileUploadDto,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Req() { headers: { origin } }: Request,
    @UploadedFile() { filename }: Express.Multer.File,
  ) {
    const newOrigin = origin.replace(/\d+/, () => 'upload');
    return join(newOrigin, config.projectName, filename);
  }
}
