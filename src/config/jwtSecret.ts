export default {
  secret: 'mbss',
  signOptions: {
    expiresIn: '1d',
  },
  routerWhitelist: ['user/login', 'file/upload'],
};
