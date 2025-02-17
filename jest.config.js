export default {
    testEnvironment: 'node',
    verbose: true,
    setupFilesAfterEnv: ['./tests/setup/jest.setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 10000,
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    globals: {
        'process.env': {
            NODE_ENV: 'test'
        }
    },
    globalSetup: './tests/setup/global-setup.cjs',
    globalTeardown: './tests/setup/global-teardown.cjs'
};
