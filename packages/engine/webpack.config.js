const { composePlugins, withNx } = require('@nx/webpack');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = composePlugins(withNx(), (config) => {
  config.plugins.push(new IgnoreDynamicRequire());

  config.externals = {
    'isolated-vm': 'commonjs2 isolated-vm',
    'utf-8-validate': 'commonjs2 utf-8-validate',
    'bufferutil': 'commonjs2 bufferutil'
  };

  return config;
});
