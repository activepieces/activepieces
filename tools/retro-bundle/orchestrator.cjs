#!/usr/bin/env node
// Drives the whole pipeline: load targets -> filter (drop already-bundled) -> per target:
// resumable pre-check -> build -> gate -> (seed). Idempotent + resumable via the ledger.
// Defaults to the LOCAL filesystem store so it runs end-to-end without a live S3 bucket.
//
// Usage:
//   node orchestrator.cjs                          # all eligible targets, local store, seed
//   node orchestrator.cjs --limit 20               # first 20
//   node orchestrator.cjs --only @activepieces/piece-openai@0.9.2
//   node orchestrator.cjs --pieces openai,duckdb   # all target lines of these pieces
//   node orchestrator.cjs --no-seed                # build + gate only, do not upload
//   node orchestrator.cjs --sample 100 --jobs 2    # random 100, 2 workers in parallel
//   RETRO_STORE=s3 S3_BUCKET=ap-pieces node orchestrator.cjs   # real S3
//
// Each target builds in its OWN child process (run-target.cjs) so memory + the in-process esbuild
// service are released per target — a single long-lived process OOMs after ~60 builds.
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { resolveConfig } = require('./lib/config.cjs')
const { makeStore } = require('./lib/store.cjs')
const { openLedger } = require('./lib/ledger.cjs')

async function main() {
  const argv = parseArgv(process.argv.slice(2))
  const cfg = resolveConfig(argv)
  const store = makeStore(cfg.store)
  const ledger = openLedger(cfg.ledgerPath)
  const seed = !argv['no-seed']

  let targets = loadTargets(cfg.csvPath)
  const before = targets.length
  targets = targets.filter((t) => !t.alreadyBundled) // drop the 9 post-cutover bundles
  if (argv.pieces) {
    const names = new Set(argv.pieces.split(',').map((p) => `@activepieces/piece-${p.trim()}`))
    targets = targets.filter((t) => names.has(t.name))
  }
  if (argv.only) {
    const set = new Set(argv.only.split(','))
    targets = targets.filter((t) => set.has(`${t.name}@${t.targetVersion}`))
  }
  if (argv.sample) {
    targets = seededSample(targets, +argv.sample, String(argv.seed || 'retro')) // representative random subset
  }
  targets.sort((a, b) => a.name.localeCompare(b.name) || cmpSemver(a.targetVersion, b.targetVersion))
  if (argv.limit) {
    targets = targets.slice(0, +argv.limit)
  }

  const jobs = Math.max(1, +(argv.jobs || 1))
  console.log(`Store: ${store.describe()} | seed: ${seed} | jobs: ${jobs} | ledger: ${cfg.ledgerPath}`)
  console.log(`Targets: ${targets.length} (of ${before} total, dropped already-bundled & filters)\n`)

  // Children resolve the same store + ledger from env. run-target handles the resumable skip itself.
  const childEnv = {
    ...process.env,
    RETRO_STORE: cfg.store.backend,
    RETRO_LOCAL_DIR: cfg.store.localDir,
    RETRO_LEDGER: cfg.ledgerPath,
    RETRO_WORK_DIR: cfg.workDir,
    RETRO_GATE_DIR: cfg.gateDir,
    ...(cfg.store.bucket ? { S3_BUCKET: cfg.store.bucket } : {}),
    ...(cfg.store.endpoint ? { S3_ENDPOINT: cfg.store.endpoint } : {}),
    ...(cfg.store.region ? { S3_REGION: cfg.store.region } : {}),
  }
  const worker = path.join(__dirname, 'run-target.cjs')
  const extra = [...(seed ? [] : ['--no-seed']), ...(argv.force ? ['--force'] : [])]

  let idx = 0
  let done = 0
  // Each worker slot gets its OWN npm + bun cache. Concurrent npm/bun installs racing on a SHARED
  // cache intermittently produce a corrupt/incomplete node_modules (missing transitive dep at load) —
  // that was the only cause of flakiness at --jobs > 1. Per-slot caches make parallelism safe.
  async function runWorker(slot) {
    // Only isolate caches when running in parallel; at --jobs 1 reuse the warm shared cache (faster).
    const slotEnv = jobs > 1
      ? { ...childEnv, npm_config_cache: path.join(cfg.workDir, `.npm-cache-${slot}`), BUN_INSTALL_CACHE_DIR: path.join(cfg.workDir, `.bun-cache-${slot}`) }
      : childEnv
    while (idx < targets.length) {
      const t = targets[idx++]
      await new Promise((resolve) => {
        const child = spawn('node', [worker, t.name, t.targetVersion, ...extra], { stdio: 'inherit', env: slotEnv })
        const finish = () => { done++; resolve() }
        child.on('close', finish)
        child.on('error', finish)
      })
    }
  }
  await Promise.all(Array.from({ length: jobs }, (_, slot) => runWorker(slot)))

  const final = openLedger(cfg.ledgerPath)
  console.log(`\n=== SUMMARY (ledger, ${done} processed this run) ===`)
  console.log(`  seeded=${final.count('seeded')} built=${final.count('built')} quarantined=${final.count('quarantined')} failed=${final.count('failed')}`)
  console.log(`Run \`node analyze-run.cjs\` for the full breakdown.`)
}

function loadTargets(csvPath) {
  if (csvPath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(csvPath, 'utf8')).map((r) => ({
      name: r.name, targetVersion: r.targetVersion, minorLine: r.minorLine,
      frameworkDep: r.frameworkDep || null, alreadyBundled: !!r.alreadyBundled,
    }))
  }
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1)
  return lines.map((l) => {
    const [name, targetVersion, minorLine, frameworkDep, , alreadyBundled] = l.split(',')
    return { name, targetVersion, minorLine, frameworkDep: frameworkDep || null, alreadyBundled: alreadyBundled === 'true' }
  })
}

function cmpSemver(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number)
  return (pa[0] - pb[0]) || (pa[1] - pb[1]) || (pa[2] - pb[2])
}

// Reproducible random subset: seeded mulberry32 shuffle, then take n. Same seed => same sample.
function seededSample(arr, n, seed) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let s = h >>> 0
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}
function parseArgv(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const k = args[i].slice(2)
      const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
      out[k] = v
    }
  }
  return out
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
