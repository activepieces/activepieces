const path = require('path');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');
const { composePlugins, withNx } = require('@nrwl/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  config = {
    ...config,
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
    entry: path.resolve(__dirname, 'src/main.ts'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'activepieces-engine.js',
      publicPath: '/dist/',
    },
    // resolve: {
    //   extensions: ['.ts', '.js', 'jsx', 'tsx'],
    // },
    target: 'node',
    externals: [path.resolve(__dirname, '/codes/')],
  }
  return config;
});

/*
  config = {
    ...config,
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
    entry: path.resolve(__dirname, 'src/main.ts'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'activepieces-engine.js',
      publicPath: '/dist/',
    },
    resolve: {
      extensions: ['.ts', '.js', 'jsx', 'tsx'],
    },
    target: 'node',
    externals: [path.resolve(__dirname, '/codes/')],
  }
  */
