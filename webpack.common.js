const path = require('path');
const Dotenv = require('dotenv-webpack');

const isProduction = process.env.NODE_ENV === 'production';

console.log('Building with isProduction:', isProduction);

module.exports = {
  entry: {
    app: './js/app.js',
  },
  plugins: [
    new Dotenv()
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: 'js/[name].js',
    publicPath: '',
  },
};
