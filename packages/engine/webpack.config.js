const path = require('path');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, 'src/main.ts'),
  output: {
    path: path.resolve(__dirname, '../../dist/packages/engine'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@activepieces/shared': path.resolve(__dirname, '../shared/src'),
      '@activepieces/pieces-framework': path.resolve(__dirname, '../pieces/community/framework/src'),
      '@activepieces/pieces-common': path.resolve(__dirname, '../pieces/community/common/src'),
    },
  },
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }],
  },
  plugins: [new IgnoreDynamicRequire()],
  externals: {
    'isolated-vm': 'commonjs2 isolated-vm',
    'utf-8-validate': 'commonjs2 utf-8-validate',
    'bufferutil': 'commonjs2 bufferutil',
  },
  devtool: 'source-map',
};
