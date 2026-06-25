#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'target-list.json'), 'utf8'))
const ok = data.pieces.filter((p) => p.npmStatus === 'ok')
const CUTOVER = '2026-06-21' // bundling cutover date

const rows = []
for (const p of ok) for (const t of p.targets) {
  rows.push({
    name: p.name,
    targetVersion: t.targetVersion,
    minorLine: t.minorLine,
    frameworkDep: t.frameworkDep || '',
    publishedAt: t.publishedAt || '',
    alreadyBundled: t.publishedAt ? (t.publishedAt.slice(0, 10) >= CUTOVER) : false,
  })
}
// CSV
const csv = ['name,targetVersion,minorLine,frameworkDep,publishedAt,alreadyBundled']
  .concat(rows.map((r) => `${r.name},${r.targetVersion},${r.minorLine},${r.frameworkDep},${r.publishedAt},${r.alreadyBundled}`))
fs.writeFileSync(path.resolve(__dirname, 'publish-targets.csv'), csv.join('\n'))
fs.writeFileSync(path.resolve(__dirname, 'publish-targets.json'), JSON.stringify(rows, null, 2))

const needBundle = rows.filter((r) => !r.alreadyBundled)
console.log(`Total minor-line targets: ${rows.length}`)
console.log(`  already bundled (published >= ${CUTOVER}): ${rows.length - needBundle.length}`)
console.log(`  NEED retro-bundling (pre-cutover): ${needBundle.length}`)
console.log(`Wrote publish-targets.csv + publish-targets.json`)
// breakdown of need-bundle by year
const byYear = {}
for (const r of needBundle) { const y = (r.publishedAt || '????').slice(0, 4); byYear[y] = (byYear[y] || 0) + 1 }
console.log('need-bundle by publish year:', JSON.stringify(byYear))
