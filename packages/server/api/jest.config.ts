/* eslint-disable */
export default {
  displayName: 'server-api',
  preset: '../../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  "moduleNameMapper": {
    "isolated-vm": "<rootDir>/__mocks__/isolated-vm.js",
    "^@activepieces/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
    "^@activepieces/ee-shared$": "<rootDir>/../../../packages/ee/shared/src/index.ts"
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/packages/server/api',
  testTimeout: 250000,
  maxWorkers: 1
};