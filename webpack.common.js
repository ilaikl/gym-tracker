const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    app: './js/app.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: 'js/app.js',
    publicPath: isProduction ? '/gym-tracker/' : '/',
  },
};
