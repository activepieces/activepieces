export default {
    displayName: 'server-worker',
    preset: '../../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../../coverage/packages/server/worker',
    testMatch: [
        '<rootDir>/**/*.test.ts',
        '<rootDir>/**/*.spec.ts',
    ],
}