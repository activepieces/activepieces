#!/usr/bin/env node
// End-to-end test of the WHOLE pipeline with NO live S3 and NO running engine.
// Uses a throwaway local filesystem store as the "S3 bucket", then runs:
//   build -> gate -> seed(local store) -> verify-served(fetch from store) -> assert
// Highlights:
//   - openai@0.9.2 (the previously-broken tiktoken/wasm case) now PASSES *because* the asset
//     detector externalizes tiktoken so the runtime install ships its .wasm.
//   - a fast unit check that the assembled-bundle scanner flags orphan assets + forked siblings.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { makeStore, bundleKey } = require('./lib/store.cjs')
const { buildBundle } = require('./lib/build.cjs')
const { gateBundle } = require('./lib/gate.cjs')
const { scanAssembledBundle } = require('./lib/asset-detector.cjs')

const TARGETS = [
  { name: '@activepieces/piece-hackernews', version: '0.4.4', expect: 'PASS', note: 'trivial' },
  { name: '@activepieces/piece-google-sheets', version: '0.1.3', expect: 'PASS', note: 'ancient pre-rename: framework as peerDep (0.1.3), tslib peer' },
  { name: '@activepieces/piece-google-sheets', version: '0.6.8', expect: 'PASS', note: 'old framework 0.6.15 inlined' },
  { name: '@activepieces/piece-duckdb', version: '0.0.6', expect: 'PASS', note: 'native externalized' },
  { name: '@activepieces/piece-openai', version: '0.9.2', expect: 'PASS', note: 'asset detector externalizes tiktoken (was broken)' },
]

function assert(cond, msg, failures) {
  if (!cond) { failures.push(msg); console.log(`   ✗ ${msg}`) }
  else { console.log(`   ✓ ${msg}`) }
}

async function main() {
  const failures = []

  console.log('=== Part 1: asset-scanner unit checks (no install) ===')
  // The gate's backstop only flags run-time forked/exec'd __dirname siblings (what the load test can't see).
  assert(scanAssembledBundle({ bundleSource: `require("child_process").fork(__dirname+"/runner.js")` }).some((f) => f.includes('sibling')), 'flags forked __dirname sibling', failures)
  // Regression guard for the azure false positive: a bare embedded-wasm label is NOT flagged
  // (emscripten embeds the bytes; genuine load failures are caught by the standalone require test).
  assert(scanAssembledBundle({ bundleSource: `var f="crc64.wasm";var wasm=["AGFzbQEAAA"]` }).length === 0, 'embedded-wasm label is NOT flagged (azure regression)', failures)
  assert(scanAssembledBundle({ bundleSource: `module.exports = { run: () => 1 }` }).length === 0, 'clean bundle has zero fatal findings', failures)

  console.log('\n=== Part 2: full pipeline against a LOCAL store (no S3, no engine) ===')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-e2e-'))
  const workDir = path.join(tmp, 'work')
  const gateDir = path.join(tmp, 'gate')
  const storeDir = path.join(tmp, 'local-s3')
  fs.mkdirSync(workDir, { recursive: true }); fs.mkdirSync(gateDir, { recursive: true })
  const store = makeStore({ backend: 'local', localDir: storeDir })
  console.log(`local store ("the bucket"): ${store.describe()}\n`)

  for (const t of TARGETS) {
    const tag = `${t.name.replace('@activepieces/piece-', '')}@${t.version}`
    console.log(`--- ${tag}  (${t.note}) ---`)
    let build
    try {
      build = await buildBundle({ name: t.name, version: t.version, workDir, log: () => {} })
    }
    catch (e) {
      assert(false, `${tag} build threw: ${e.message.split('\n')[0]}`, failures); continue
    }
    if (!build.ok) { assert(false, `${tag} build failed: ${build.error}`, failures); continue }
    console.log(`   built ${(build.bundleBytes / 1024).toFixed(0)}KB · fw=${build.installedFrameworkVersion || 'none'} · externals=${Object.keys(build.externalizedDeps).join(',') || 'none'}`)

    // every external must be pinned (no '*')
    const floating = Object.entries(build.externalizedDeps).filter(([, v]) => /[\^~*]|x/i.test(v) || v === '*')
    assert(floating.length === 0, `${tag} all externals pinned (no '*')`, failures)

    // openai: prove the detector externalized tiktoken (the fix)
    if (t.name.endsWith('piece-openai')) {
      const ext = build.assetExternalized.map((a) => a.pkg)
      assert(ext.includes('tiktoken'), `${tag} asset detector externalized tiktoken (was the broken inline)`, failures)
      assert('tiktoken' in build.externalizedDeps, `${tag} tiktoken re-declared as a pinned runtime dep`, failures)
    }

    // gate the built bundle
    const gate = gateBundle({ name: t.name, version: t.version, tarballPath: build.tarballPath, gateDir })
    assert(gate.status === t.expect, `${tag} gate status == ${t.expect} (got ${gate.status}${gate.loadError ? ': ' + gate.loadError : ''})`, failures)

    // seed to the local store, then verify the SERVED bytes install + load
    const key = bundleKey({ name: t.name, version: t.version })
    await store.put(key, build.tarballPath)
    assert(await store.head(key), `${tag} seeded to local store (${key})`, failures)
    const served = path.join(tmp, `served-${t.name.replace('/', '-')}-${t.version}.tgz`)
    await store.get(key, served)
    const servedGate = gateBundle({ name: t.name, version: t.version, tarballPath: served, gateDir })
    assert(servedGate.status === 'PASS' && servedGate.loadsStandalone, `${tag} served copy installs & loads standalone (${servedGate.actionCount} actions)`, failures)
    fs.rmSync(build.root, { recursive: true, force: true })
    fs.rmSync(served, { force: true })
    console.log('')
  }

  // prove rollback semantics on the local store
  console.log('--- rollback check ---')
  const k = bundleKey({ name: '@activepieces/piece-hackernews', version: '0.4.4' })
  await store.del(k)
  assert(!(await store.head(k)), 'rollback (delete) removes the object -> resolver would fall back to npm', failures)

  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\n=== RESULT: ${failures.length === 0 ? 'ALL CHECKS PASSED' : failures.length + ' FAILURE(S)'} ===`)
  if (failures.length) { failures.forEach((f) => console.log(' - ' + f)); process.exit(1) }
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
