const path = require('path');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, 'src/bootstrap.ts'),
  output: {
    path: path.resolve(__dirname, '../../../dist/packages/server/api'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }],
  },
  plugins: [new IgnoreDynamicRequire()],
  devtool: 'source-map',
};
