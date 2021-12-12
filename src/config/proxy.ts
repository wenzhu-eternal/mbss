const prod = !(process.env.NODE_ENV === 'development');

export const getAllowOrigin = () => {
  if (prod) {
    return '';
  }
  return 'http://localhost:3000';
}
