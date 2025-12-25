
process.env.AP_EXECUTION_MODE = 'UNSANDBOXED'
process.env.AP_BASE_CODE_DIRECTORY = 'packages/engine/test/resources/codes'
process.env.AP_TEST_MODE = 'true'
process.env.AP_DEV_PIECES = 'http,data-mapper,approval,webhook'

/* eslint-disable */
export default {
  displayName: 'engine',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!string\-replace\-async)"],
  moduleFileExtensions: ['ts', 'js', 'html', 'node'],
  coverageDirectory: '../../coverage/packages/engine',
  testTimeout: 20000,
};
