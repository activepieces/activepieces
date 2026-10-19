import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const distFolder = process.argv[2]
if (!distFolder) {
    console.error('[heap-check-child] missing dist folder argv')
    process.exit(2)
}

if (typeof global.gc !== 'function') {
    console.error('[heap-check-child] run with --expose-gc')
    process.exit(2)
}

const pkg = createRequire(import.meta.url)(resolve(distFolder, 'package.json'))
const entryRel = pkg.main ?? 'index.js'
const entry = resolve(distFolder, entryRel)

const require = createRequire(import.meta.url)

global.gc()
const before = process.memoryUsage()
const t0 = process.hrtime.bigint()
try {
    require(entry)
} catch (e) {
    console.log(JSON.stringify({ error: String(e).split('\n')[0].slice(0, 240) }))
    process.exit(0)
}
const t1 = process.hrtime.bigint()
global.gc()
const after = process.memoryUsage()

console.log(JSON.stringify({
    heapDeltaBytes: after.heapUsed - before.heapUsed,
    heapAfterBytes: after.heapUsed,
    rssDeltaBytes: after.rss - before.rss,
    externalDeltaBytes: after.external - before.external,
    requireMs: Number(t1 - t0) / 1e6,
}))
