const path = require('path');

module.exports = {
  devtool: false,
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: ['/node_modules/', '/coverage/', '/sample/'],
        use: ['ts-loader']
      },
    ],
  },
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'activepieces-worker-bundle.js',
    publicPath: '/dist/',
  },
  resolve: {
    extensions: ['.ts', '.js', 'jsx', 'tsx'],
  },
  target: 'node',
  externals: [path.resolve(__dirname, '/codes/')],
};
