import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    environmentMatchGlobs: [
      ['apps/web/src/**/*.test.tsx', 'jsdom'],
      ['apps/web/src/test/**/*.test.ts', 'jsdom'],
    ],
    setupFiles: ['apps/web/src/test/setup.ts'],
    passWithNoTests: true,
  },
});
