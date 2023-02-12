const { composePlugins, withNx } = require('@nrwl/webpack');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');

module.exports = composePlugins(withNx(), (config) => {
  config.plugins.push(new IgnoreDynamicRequire())
  config.externals = [];
  return config;
});
