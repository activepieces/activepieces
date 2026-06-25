#!/usr/bin/env node
// Promote vetted bundles from one store to another (e.g. local staging -> real S3), then verify.
// The orchestrator stages build+gate+seed into the LOCAL store with no S3 needed; this tool releases
// those staged objects to S3 in phases (canary -> batch) by selecting which keys to copy.
//
// Usage:
//   node seed.cjs --to s3 --only @activepieces/piece-hackernews@0.4.4   # promote one (canary)
//   node seed.cjs --to s3 --all                                         # promote everything staged
//   node seed.cjs --from local --to local --localDir2 ./other --all     # local->local dry run
//   S3_BUCKET=ap-pieces S3_ENDPOINT=... node seed.cjs --to s3 --limit 5
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { resolveConfig } = require('./lib/config.cjs')
const { makeStore, bundleKey } = require('./lib/store.cjs')

async function main() {
  const argv = parseArgv(process.argv.slice(2))
  const cfg = resolveConfig({ ...argv, store: argv.from || 'local' })
  const from = makeStore(cfg.store)
  const to = makeStore({
    backend: argv.to || 's3',
    localDir: argv.localDir2 || path.join(cfg.store.localDir, '..', '.local-s3-dest'),
    bucket: process.env.S3_BUCKET, endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION,
  })

  let keys
  if (argv.only) {
    keys = argv.only.split(',').map((nv) => { const i = nv.lastIndexOf('@'); return bundleKey({ name: nv.slice(0, i), version: nv.slice(i + 1) }) })
  }
  else if (argv.all) {
    keys = await from.list()
  }
  else {
    console.error('specify --only <name@ver,...> or --all'); process.exit(2)
  }
  if (argv.limit) keys = keys.slice(0, +argv.limit)

  console.log(`Promote ${keys.length} object(s): ${from.describe()} -> ${to.describe()}\n`)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-seed-'))
  let ok = 0, miss = 0
  for (const key of keys) {
    if (!(await from.head(key))) { console.log(`MISS  ${key} (not in source)`); miss++; continue }
    const local = path.join(tmp, path.basename(key))
    await from.get(key, local)
    await to.put(key, local)
    const present = await to.head(key)
    console.log(`${present ? 'OK   ' : 'FAIL '} ${key}`)
    if (present) ok++
    fs.rmSync(local, { force: true })
  }
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\nPromoted ${ok}/${keys.length} (missing in source: ${miss})`)
}

function parseArgv(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { const k = args[i].slice(2); out[k] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true }
  }
  return out
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
