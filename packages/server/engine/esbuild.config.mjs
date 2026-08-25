import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.resolve(__dirname, '../../../dist/packages/engine');
const proxyOutfile = path.join(outdir, 'main.js');
const pieceChildOutfile = path.join(outdir, 'piece-child.js');

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

function rebuildLogger(outfile) {
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
        } else {
          console.log(`[engine] ${label} done in ${Date.now() - startedAt}ms`);
        }
      });
    },
  };
}

function buildOptions({ outfile, entry = 'src/main.ts' }) {
  return {
    entryPoints: [path.resolve(__dirname, entry)],
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
    plugins: [zodLocaleTrim, rebuildLogger(outfile)],
  };
}

const targets = [
  buildOptions({ outfile: proxyOutfile }),
  buildOptions({ outfile: pieceChildOutfile, entry: 'src/piece-child.ts' }),
];

if (watch) {
  for (const target of targets) {
    const ctx = await esbuild.context(target);
    await ctx.rebuild();
    await ctx.watch();
  }
} else {
  await Promise.all(targets.map((target) => esbuild.build(target)));
}
