import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 10000,
        clearMocks: true,
        include: ['tests/**/*.tests.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'lcov', 'html'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts', '!src/types/generated/**'],
            exclude: ['node_modules/**', 'tests/**', 'vite.config.ts', 'vitest.config.ts', '**/*.d.ts']
        }
    }
});
