#!/usr/bin/env node
// Per-(name,version) rollback: delete the S3 object. Next engine resolve() finds objectExists=false
// and 307-redirects to the npm tarball — the original heavy version is never mutated, so rollback is
// clean, instant, and per-target. (Note: already-issued 7-day signed URLs outlive deletion.)
//
// Usage:
//   node rollback.cjs --only @activepieces/piece-openai@0.9.2
//   node rollback.cjs --only a@1.0.0,b@2.0.0
//   RETRO_STORE=s3 S3_BUCKET=ap-pieces node rollback.cjs --only ...
const { resolveConfig } = require('./lib/config.cjs')
const { makeStore, bundleKey } = require('./lib/store.cjs')

async function main() {
  const argv = parseArgv(process.argv.slice(2))
  if (!argv.only) { console.error('specify --only <name@ver,...>'); process.exit(2) }
  const cfg = resolveConfig(argv)
  const store = makeStore(cfg.store)
  const keys = argv.only.split(',').map((nv) => { const i = nv.lastIndexOf('@'); return bundleKey({ name: nv.slice(0, i), version: nv.slice(i + 1) }) })

  console.log(`Rollback ${keys.length} object(s) from ${store.describe()}\n`)
  for (const key of keys) {
    const had = await store.head(key)
    await store.del(key)
    console.log(`${had ? 'DELETED' : 'ABSENT '} ${key}${had ? ' -> resolver will fall back to npm tarball' : ''}`)
  }
}

function parseArgv(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { const k = args[i].slice(2); out[k] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true }
  }
  return out
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
