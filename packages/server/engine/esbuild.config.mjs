import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const outdir = path.resolve(repoRoot, 'dist/packages/engine');
const outfile = path.join(outdir, 'main.js');

const watch = process.argv.includes('--watch');

fs.rmSync(outdir, { recursive: true, force: true });

const zodLocaleTrim = {
  // Drop zod's 46 unused locale packs (~184KB). The app surfaces validation
  // errors via its own i18n (translation.json) and never calls z.locales/z.config,
  // so only `en` (zod core's default error formatter) is needed.
  name: 'zod-locale-trim',
  setup(build) {
    build.onLoad(
      { filter: /zod[\\/].*[\\/]locales[\\/]index\.(js|mjs|cjs)$/ },
      () => ({
        contents: "export { default as en } from './en.js'",
      })
    );
  },
};

// The engine bundle is consumed from the cache common dir mounted into the sandbox, not from
// dist. In prod the worker copies it there once at boot; in dev the worker process is long-lived
// across engine rebuilds, so this hook re-copies on every --watch rebuild to keep it fresh.
// The destination version is read from the same JSON the runtime uses (LATEST_CACHE_VERSION) so
// a version bump can't desync. Only runs under --watch; the prod build happens at image-build
// time where the runtime cache dir does not exist yet.
const cacheVersion = JSON.parse(
  fs.readFileSync(
    path.resolve(repoRoot, 'packages/server/sandbox-pool/src/lib/cache/cache-version.json'),
    'utf8'
  )
).version;

function copyEngineToCache() {
  const cacheBase = process.env.AP_CACHE_BASE_PATH ?? 'cache';
  const commonDir = path.resolve(repoRoot, cacheBase, cacheVersion, 'common');
  fs.mkdirSync(commonDir, { recursive: true });
  for (const file of ['main.js', 'main.js.map']) {
    const src = path.join(outdir, file);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(commonDir, file);
    const temp = `${dest}.temp.${process.pid}.${Date.now()}`;
    fs.copyFileSync(src, temp);
    fs.renameSync(temp, dest);
  }
}

function rebuildLogger() {
  const label = path.basename(outfile);
  return {
    name: 'engine-rebuild-logger',
    setup(build) {
      let startedAt = 0;
      build.onStart(() => {
        startedAt = Date.now();
        console.log(`[engine] rebuilding ${label}…`);
      });
      build.onEnd((result) => {
        if (result.metafile) {
          fs.writeFileSync(
            outfile + '.meta.json',
            JSON.stringify(result.metafile)
          );
        }
        const errors = result.errors?.length ?? 0;
        if (errors > 0) {
          console.log(`[engine] ${label} failed with ${errors} error(s)`);
          return;
        }
        console.log(`[engine] ${label} done in ${Date.now() - startedAt}ms`);
        if (watch) {
          copyEngineToCache();
        }
      });
    },
  };
}

function buildOptions() {
  return {
    entryPoints: [path.resolve(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile,
    format: 'cjs',
    sourcemap: true,
    minify: !watch,
    metafile: true,
    treeShaking: true,
    alias: {
        '@activepieces/shared': path.resolve(__dirname, '../../core/shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
        '@activepieces/core-utils': path.resolve(__dirname, '../../core/utils/src'),
        '@activepieces/core-piece-types': path.resolve(__dirname, '../../core/piece-types/src'),
        '@activepieces/core-formula': path.resolve(__dirname, '../../core/formula/src'),
        '@activepieces/core-execution': path.resolve(__dirname, '../../core/execution/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
    plugins: [zodLocaleTrim, rebuildLogger()],
  };
}

if (watch) {
  const ctx = await esbuild.context(buildOptions());
  await ctx.rebuild();
  await ctx.watch();
} else {
  await esbuild.build(buildOptions());
}
