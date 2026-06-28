#!/usr/bin/env node
// Prove a deployed flow would actually RECEIVE and run the bundle.
//   store mode (default): fetch the object from the store and gate the served bytes — no engine,
//                         no live S3 needed (point at the local store).
//   engine mode:          hit the real engine endpoint, assert 307 -> signed URL, download it,
//                         and gate the served copy. Needs --engine <api> --token <engine-jwt>.
//
// Usage:
//   node verify-served.cjs --only @activepieces/piece-hackernews@0.4.4
//   node verify-served.cjs --only ... --engine https://cloud.activepieces.com --token $ENGINE_TOKEN
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { resolveConfig } = require('./lib/config.cjs')
const { makeStore, bundleKey } = require('./lib/store.cjs')
const { gateBundle } = require('./lib/gate.cjs')

async function main() {
  const argv = parseArgv(process.argv.slice(2))
  if (!argv.only) { console.error('specify --only <name@ver,...>'); process.exit(2) }
  const cfg = resolveConfig(argv)
  const store = makeStore(cfg.store)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-verify-'))

  let pass = 0, fail = 0
  for (const nv of argv.only.split(',')) {
    const i = nv.lastIndexOf('@')
    const name = nv.slice(0, i), version = nv.slice(i + 1)
    const key = bundleKey({ name, version })
    let tarball
    try {
      tarball = argv.engine
        ? await fetchViaEngine({ api: argv.engine, token: argv.token, name, version, tmp })
        : await fetchViaStore({ store, key, tmp })
    }
    catch (e) {
      console.log(`FAIL  ${nv}  [fetch] ${e.message}`); fail++; continue
    }
    const gate = await gateBundle({ name, version, tarballPath: tarball, gateDir: cfg.gateDir })
    const ok = gate.status === 'PASS'
    console.log(`${ok ? 'PASS ' : gate.status.padEnd(5)} ${nv}  load=${gate.loadsStandalone} actions=${gate.actionCount ?? '-'} leaks=${gate.sdkLeaks.join(',') || 'none'}${gate.loadError ? ' :: ' + gate.loadError : ''}`)
    ok ? pass++ : fail++
  }
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\nserved-and-verified: ${pass} PASS / ${fail} not-PASS`)
  if (fail) process.exit(1)
}

async function fetchViaStore({ store, key, tmp }) {
  if (!(await store.head(key))) throw new Error(`not in store: ${key}`)
  const dest = path.join(tmp, path.basename(key))
  await store.get(key, dest)
  return dest
}

// Mirrors the engine contract: GET /v1/engine/pieces/bundle?name=&version= -> 307 -> signed URL.
async function fetchViaEngine({ api, token, name, version, tmp }) {
  const url = `${api}/v1/engine/pieces/bundle?name=${encodeURIComponent(name)}&version=${version}`
  const headers = execFileSync('curl', ['-sS', '-D', '-', '-o', '/dev/null', '-H', `Authorization: Bearer ${token}`, url]).toString()
  const status = headers.match(/HTTP\/[\d.]+\s+(\d+)/)?.[1]
  const loc = headers.match(/[Ll]ocation:\s*(\S+)/)?.[1]
  if (status !== '307' || !loc) throw new Error(`expected 307+Location, got ${status}`)
  const dest = path.join(tmp, `${name.replace('/', '-')}-${version}.tgz`)
  execFileSync('curl', ['-sS', '-o', dest, loc])
  return dest
}

function parseArgv(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { const k = args[i].slice(2); out[k] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true }
  }
  return out
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
