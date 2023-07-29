const { composePlugins, withNx } = require('@nx/webpack');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = composePlugins(withNx(), (config) => {
  config.plugins.push(new IgnoreDynamicRequire());
  return config;
});
