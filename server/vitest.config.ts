import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/testSetup.ts'],
    // Integration tests share one live MongoDB instance across files — run
    // test files sequentially so their fixture cleanup doesn't race.
    fileParallelism: false,
  },
});
