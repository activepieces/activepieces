import path from 'path';
import { defineConfig } from 'vitest/config';

const repoRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // The integration suite talks to a real server, and against a remote one
    // (Azure SQL) a single connect, TLS handshake and login can outlast the 5s
    // default on its own. Set high enough that a slow link never looks like a
    // failure, and let genuinely long tests raise it further per test.
    testTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@activepieces/shared': path.resolve(
        repoRoot,
        'packages/core/shared/src/index.ts'
      ),
      '@activepieces/pieces-framework': path.resolve(
        repoRoot,
        'packages/pieces/framework/src/index.ts'
      ),
      '@activepieces/pieces-common': path.resolve(
        repoRoot,
        'packages/pieces/common/src/index.ts'
      ),
    },
  },
});
