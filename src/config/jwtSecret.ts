export default {
  secret: 'mbss',
  signOptions: {
    expiresIn: '1d',
  },
  routerWhitelist: ['/api/user/login', '/api/file/upload'],
};
