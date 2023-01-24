const path = require('path');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');
const { composePlugins, withNx } = require('@nrwl/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  config = {
    ...config,
    plugins: [new IgnoreDynamicRequire()],
    externals: [],
  }
  return config;
});