// vitest.config.js

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    sequence: {
      // Run tests sequentially rather than in parallel for our shared setup
      hooks: 'list',
      setup: 'list',
    },
    watch: false, // Disable watch mode
    include: ['tests/**/*.test.js'], // Only include test files
    exclude: ['tests/node_modules/**'], // Exclude node_modules
    coverage: {
      provider: 'v8',
    },
    pool: 'forks', // Use forks for test isolation while maintaining speed
    poolOptions: {
      forks: {
        singleFork: true // Run in a single fork since we share setup
      }
    },
    testTimeout: 30000, // 30 seconds timeout
    teardownTimeout: 1000, // Short teardown timeout
    onConsoleLog(log) {
      // Filter out verbose logs with sensible defaults
      if (log.includes('watching for file changes') || 
          log.includes('press h to show help') || 
          log.includes('press q to quit')) {
        return false; // Don't display these messages
      }
      return true; // Display all other messages
    },
  },
});