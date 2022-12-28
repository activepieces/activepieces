module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/*.test.ts', '<rootDir>/test/**/*.test.ts'],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    'node_modules',
    '<rootDir>/test/resources/*',
    '<rootDir>/test/resources/*/*',
  ],
};
