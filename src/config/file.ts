import { diskStorage } from 'multer';
import * as fs from 'fs';
import { join } from 'path';
import { MulterModuleOptions } from '@nestjs/platform-express';

const projectName = 'mbss';
const dirName = '/';

export const getFileSrc = (origin, filename) => {
  const newOrigin = origin.replace(/\d+/, () => 'upload');
  return join(newOrigin, projectName, filename);
};

const createMkdir = (paths) =>
  !fs.existsSync(join(dirName, paths)) && fs.mkdirSync(join(dirName, paths));

const fileConfig: MulterModuleOptions = {
  preservePath: true,
  storage: diskStorage({
    destination(_, __, cb) {
      createMkdir(projectName);

      cb(null, join(dirName, projectName));
    },
    filename: (_, file, cb) => {
      return cb(null, `${new Date().getTime()}-${file.originalname}`);
    },
  }),
};

export default fileConfig;
