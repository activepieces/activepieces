const path = require('path');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = {
  devtool: false,
  context: __dirname,
  plugins: [new IgnoreDynamicRequire()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: ['/node_modules/', '/coverage/', '/sample/'],
        use: ['ts-loader'],
      },
    ],
  },
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'activepieces-worker.js',
    publicPath: '/dist/',
  },
  resolve: {
    extensions: ['.ts', '.js', 'jsx', 'tsx'],
  },
  target: 'node',
  externals: [path.resolve(__dirname, '/codes/')],
};
