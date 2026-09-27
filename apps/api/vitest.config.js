import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env.test') });

export default defineConfig({ test: {
  // Discover P0-A tests (apps/api/tests/) AND P0-B+ tests (apps/api/src/tests/)
  include: ['tests/**/*.test.js', 'src/tests/**/*.test.js'],
  testTimeout: 30000,
  hookTimeout: 30000,
  pool: 'forks',
  poolOptions: { forks: { singleFork: true } },
} });
