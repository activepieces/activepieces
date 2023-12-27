const { composePlugins, withNx } = require('@nx/webpack');
const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = composePlugins(withNx(), (config) => {
  config.plugins.push(new IgnoreDynamicRequire());
  config.plugins.push(new UglifyJsPlugin({}))
  config.externals = [];
  return config;
});
