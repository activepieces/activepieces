const { composePlugins, withNx } = require('@nx/webpack');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = composePlugins(withNx(), (config) => {
  config.plugins = [new IgnoreDynamicRequire()];
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  return config;
});