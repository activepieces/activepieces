// Build-time V8 compile-cache prewarm for the engine bundle.
//
// When a sandbox is not reused, the engine is forked fresh per run and its bundled main.js is
// parsed/compiled from scratch every time. A cache populated at runtime would not survive an
// ephemeral container (e.g. Cloud Run instances), so instead we bake the bytecode into the image
// here at build time — every container then cold-boots engines from cached bytecode.
//
// Node's compile cache is keyed by the script's absolute path + content + node version + V8 flags,
// so we prewarm once per (path, flag-set) the runtime actually uses:
//   - fork mode  (SANDBOX_CODE_ONLY / UNSANDBOXED): <cacheBase>/<ver>/common/main.js, with
//     --no-node-snapshot --expose-gc (see sandbox/fork.ts)
//   - isolate mode (SANDBOX_PROCESS / SANDBOX_CODE_AND_PROCESS): /root/common/main.js, default
//     flags (see sandbox/isolate.ts — the engine common dir is bind-mounted at /root/common)
// Both blob sets share one physical dir (<cacheBase>/<ver>/common/v8-compile-cache), which the
// isolate sandbox bind-mounts at /root/common/v8-compile-cache.
//
// Keep the constants below in sync with cache-paths.ts (LATEST_CACHE_VERSION,
// ENGINE_COMPILE_CACHE_DIRNAME) and the CACHE_BASE_PATH worker default.

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const CACHE_BASE = process.env.AP_CACHE_BASE_PATH ?? 'cache'
const CACHE_VERSION = 'v12'
const COMPILE_CACHE_DIRNAME = 'v8-compile-cache'

const commonDir = path.resolve(CACHE_BASE, CACHE_VERSION, 'common')
const cacheDir = path.join(commonDir, COMPILE_CACHE_DIRNAME)
// Prod installs main-noproxy.js as main.js (see engine-installer.ts); prewarm with those bytes so
// the cached bytecode matches what the runtime actually loads.
const engineBundle = path.resolve('dist/packages/engine/main-noproxy.js')

function prewarm({ enginePath, flags }) {
    mkdirSync(path.dirname(enginePath), { recursive: true })
    copyFileSync(engineBundle, enginePath)
    copyFileSync(`${engineBundle}.map`, `${enginePath}.map`)
    // Requiring main.js compiles the whole bundle. SANDBOX_ID must stay UNSET (undefined) so
    // main.ts skips workerSocket.init() — otherwise the engine starts its socket + 60s connect
    // watchdog and never exits. flushCompileCache() persists the bytecode before we exit.
    const env = { ...process.env, NODE_COMPILE_CACHE: cacheDir }
    delete env.SANDBOX_ID
    execFileSync(
        process.execPath,
        [...flags, '-e', `require(${JSON.stringify(enginePath)}); require('node:module').flushCompileCache()`],
        { env, stdio: 'inherit', timeout: 120_000 },
    )
}

mkdirSync(cacheDir, { recursive: true })
prewarm({ enginePath: path.join(commonDir, 'main.js'), flags: ['--no-node-snapshot', '--expose-gc'] })
prewarm({ enginePath: '/root/common/main.js', flags: [] })
// Only the blobs in cacheDir are kept; the temp isolate-path copy is not a real runtime file.
rmSync('/root/common', { recursive: true, force: true })

// eslint-disable-next-line no-console
console.log(`Engine compile cache prewarmed at ${cacheDir}`)
