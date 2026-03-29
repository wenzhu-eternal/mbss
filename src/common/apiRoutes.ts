import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';

import config from '@/config/config.default';

export const apiRoutesFileName = join(String(config.uploadDir), 'apiRoutes.json');

interface RouterLayer {
  route?: {
    path: string;
  };
}

interface RouterStack {
  stack?: RouterLayer[];
}

export const createApiRoutesJson = (app: INestApplication): void => {
  const apiRouters: string[] = [];
  const stack =
    (app?.getHttpAdapter()?.getInstance() as { router?: RouterStack })?.router?.stack || [];
  stack.forEach(layer => {
    if (layer?.route) {
      apiRouters.push(layer.route.path);
    }
  });
  const filterApiRoutes = apiRouters.filter(route => route.match(/\/api\//));
  fs.writeFileSync(apiRoutesFileName, JSON.stringify(filterApiRoutes));
};

export const getApiRoutesJson = (): string => {
  return fs.readFileSync(apiRoutesFileName, 'utf-8');
};
