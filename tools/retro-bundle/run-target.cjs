#!/usr/bin/env node
// Build + gate + (seed) ONE target, then exit. Run as a child process per target so memory and the
// in-process esbuild service are released after each — a single long-lived process OOMs after ~60
// builds. Config comes from env (set by the orchestrator) so children share store + ledger.
//
// Usage: node run-target.cjs <name> <version> [--no-seed] [--force]
const fs = require('node:fs')
const { resolveConfig, KNOWN_TRICKY } = require('./lib/config.cjs')
const { makeStore, bundleKey } = require('./lib/store.cjs')
const { openLedger } = require('./lib/ledger.cjs')
const { buildBundle } = require('./lib/build.cjs')
const { gateBundle } = require('./lib/gate.cjs')

async function main() {
  const [name, version] = process.argv.slice(2)
  const argv = parseArgv(process.argv.slice(4))
  const seed = !argv['no-seed']
  const cfg = resolveConfig(argv)
  const store = makeStore(cfg.store)
  const ledger = openLedger(cfg.ledgerPath)
  const key = bundleKey({ name, version })
  const tag = `${name.replace('@activepieces/piece-', '')}@${version}`
  const tricky = KNOWN_TRICKY.has(name) ? ' [known-tricky]' : ''

  if (!argv.force && ledger.status(key) === 'seeded' && await store.head(key)) {
    console.log(`SKIP  ${tag}`)
    return
  }

  let build
  try {
    build = await buildBundle({ name, version, workDir: cfg.workDir, log: () => {} })
  }
  catch (e) {
    build = { ok: false, error: e.message.split('\n')[0] }
  }
  if (!build.ok) {
    ledger.set({ key, name, version, status: 'failed', stage: 'build', lastError: build.error })
    console.log(`FAIL  ${tag}  [build] ${build.error}`)
    cleanup(build.root)
    process.exit(1)
  }

  const gate = await gateBundle({ name, version, tarballPath: build.tarballPath, gateDir: cfg.gateDir })
  if (gate.status !== 'PASS') {
    const status = gate.status === 'QUARANTINE' ? 'quarantined' : 'failed'
    const reason = gate.loadError || (gate.assetFlush.fatal || []).join('; ') || gate.installErr || `sdk leak: ${gate.sdkLeaks.join(',')}`
    ledger.set({ key, name, version, status, stage: 'gate', lastError: reason, bundleBytes: build.bundleBytes })
    console.log(`${status === 'quarantined' ? 'QUAR ' : 'FAIL '} ${tag}${tricky}  [gate] ${reason.slice(0, 80)}`)
    cleanup(build.root)
    process.exit(status === 'quarantined' ? 3 : 1)
  }

  const assetNote = build.assetExternalized.length ? ` (ext ${build.assetExternalized.map((a) => a.pkg).join(',')})` : ''
  if (seed) {
    await store.put(key, build.tarballPath)
    const present = await store.head(key)
    ledger.set({ key, name, version, status: present ? 'seeded' : 'failed', stage: 'seed', bundleBytes: build.bundleBytes, frameworkInlined: build.installedFrameworkVersion, externalizedDeps: build.externalizedDeps })
    console.log(`SEED  ${tag}${tricky}${assetNote}  ${kb(build.bundleBytes)} fw=${build.installedFrameworkVersion || 'none'} -> ${key}`)
  }
  else {
    ledger.set({ key, name, version, status: 'built', stage: 'gate', bundleBytes: build.bundleBytes, frameworkInlined: build.installedFrameworkVersion, externalizedDeps: build.externalizedDeps })
    console.log(`BUILT ${tag}${tricky}${assetNote}  ${kb(build.bundleBytes)} fw=${build.installedFrameworkVersion || 'none'}`)
  }
  cleanup(build.root)
}

function cleanup(root) {
  if (root) fs.rmSync(root, { recursive: true, force: true })
}
function kb(b) {
  return `${(b / 1024).toFixed(0)}KB`
}
function parseArgv(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { const k = args[i].slice(2); out[k] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true }
  }
  return out
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
