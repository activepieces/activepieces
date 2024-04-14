// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.4/config/configuration-file.html

const { join } = require('path');
const getBaseKarmaConfig = require('../../../../karma.conf');

module.exports = function (config) {
  const baseConfig = getBaseKarmaConfig();
  config.set({
    ...baseConfig,
    coverageReporter: {
      ...baseConfig.coverageReporter,
      dir: join(__dirname, '../../../../coverage/packages/ee/components'),
    },
  });
};
