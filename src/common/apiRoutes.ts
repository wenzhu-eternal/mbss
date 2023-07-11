import * as fs from 'fs';
import { join } from 'path';
import config from '@/config/config.default';

export const apiRoutesFileName = join(
  config.fileDirName,
  config.projectName,
  'apiRoutes.json',
);

export const createApiRoutesJson = (app) => {
  const ApiRouters = [];
  const stack = app?.getHttpAdapter()?.getInstance()?._router?.stack || [];
  stack?.forEach((layer) =>
    layer?.route ? ApiRouters.push(layer?.route?.path) : null,
  );
  const filterApiRoutes = ApiRouters.filter((route) => route.match(/\/api\//));
  fs.writeFileSync(apiRoutesFileName, JSON.stringify(filterApiRoutes));
};

export const getApiRoutesJson = () => {
  return fs.readFileSync(apiRoutesFileName, 'utf-8');
};
