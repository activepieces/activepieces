/* eslint-disable */
export default {
  displayName: 'server-api',
  preset: '../../../jest.preset.cjs',
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
    "isolated-vm": "<rootDir>/__mocks__/isolated-vm.js"
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/packages/server/api',
  testTimeout: 120000
};