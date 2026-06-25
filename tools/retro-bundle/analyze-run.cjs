#!/usr/bin/env node
// Summarize a pipeline run from the ledger (retro-state.jsonl): pass rate, failure classes,
// size distribution, frameworks inlined, externalization. Usage: node analyze-run.cjs [ledgerPath]
const fs = require('node:fs')
const path = require('node:path')

const ledgerPath = process.argv[2] || path.join(__dirname, 'retro-state.jsonl')
const recs = new Map()
for (const line of fs.readFileSync(ledgerPath, 'utf8').split('\n')) {
  if (!line.trim()) continue
  const r = JSON.parse(line)
  recs.set(r.key, r)
}
const all = [...recs.values()]
const by = (s) => all.filter((r) => r.status === s)
const ok = all.filter((r) => r.status === 'seeded' || r.status === 'built')

console.log(`\n===== RUN SUMMARY (${all.length} targets) =====`)
for (const s of ['seeded', 'built', 'quarantined', 'failed']) {
  console.log(`  ${s.padEnd(12)} ${by(s).length}`)
}
console.log(`  PASS RATE    ${(100 * ok.length / all.length).toFixed(1)}%`)

// size distribution over successes
const sizes = ok.map((r) => r.bundleBytes).filter(Boolean).sort((a, b) => a - b)
if (sizes.length) {
  const kb = (b) => (b / 1024).toFixed(0) + 'KB'
  const sum = sizes.reduce((s, x) => s + x, 0)
  console.log(`\n  bundle size: min ${kb(sizes[0])} · median ${kb(sizes[Math.floor(sizes.length / 2)])} · max ${kb(sizes[sizes.length - 1])} · mean ${kb(sum / sizes.length)}`)
  console.log(`  over 3MB (warn): ${sizes.filter((b) => b > 3 * 1024 * 1024).length} · over 5MB (cap): ${sizes.filter((b) => b > 5 * 1024 * 1024).length}`)
}

// frameworks inlined
const fw = {}
for (const r of ok) { const f = r.frameworkInlined || 'none'; fw[f] = (fw[f] || 0) + 1 }
console.log(`\n  frameworks inlined (each target keeps its OWN): ${Object.keys(fw).length} distinct`)
console.log('   ', JSON.stringify(Object.fromEntries(Object.entries(fw).sort((a, b) => b[1] - a[1]).slice(0, 12))))

// externalization
const withExt = ok.filter((r) => r.externalizedDeps && Object.keys(r.externalizedDeps).length)
console.log(`\n  targets with externalized deps: ${withExt.length}`)
const extCount = {}
for (const r of withExt) for (const d of Object.keys(r.externalizedDeps)) extCount[d] = (extCount[d] || 0) + 1
console.log('   ', JSON.stringify(Object.fromEntries(Object.entries(extCount).sort((a, b) => b[1] - a[1]).slice(0, 12))))

// failure / quarantine classes
function classify(err) {
  if (!err) return 'unknown'
  if (/Could not resolve/i.test(err)) return 'unresolved-import (esbuild)'
  if (/Missing|Cannot find module/i.test(err)) return 'missing-asset/module at load'
  if (/fork|sibling/i.test(err)) return 'forked-sibling (asset-flush)'
  if (/peer|ERESOLVE/i.test(err)) return 'peer-dep conflict'
  if (/Build failed/i.test(err)) return 'esbuild build error'
  if (/404|E404|not found|notarget/i.test(err)) return 'npm fetch (yanked/404)'
  if (/sdk leak|@activepieces/i.test(err)) return 'sdk leak'
  if (/ETIMEDOUT|ENOTFOUND|network/i.test(err)) return 'network'
  return err.slice(0, 50)
}
const problems = [...by('failed'), ...by('quarantined')]
if (problems.length) {
  const classes = {}
  for (const r of problems) { const c = classify(r.lastError); (classes[c] = classes[c] || []).push(`${r.name.replace('@activepieces/piece-', '')}@${r.version}`) }
  console.log(`\n  ===== FAILURE / QUARANTINE CLASSES (${problems.length}) =====`)
  for (const [c, items] of Object.entries(classes).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  [${items.length}] ${c}`)
    console.log(`       ${items.slice(0, 8).join(', ')}${items.length > 8 ? ' …' : ''}`)
  }
}
