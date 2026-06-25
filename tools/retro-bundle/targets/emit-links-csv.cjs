#!/usr/bin/env node
// Emit a CSV of every major.minor target bundle with its npm links.
const fs = require('node:fs')
const path = require('node:path')
const rows = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'publish-targets.json'), 'utf8'))

function tarballUrl(name, version) {
  const unscoped = name.startsWith('@') ? name.split('/')[1] : name
  return `https://registry.npmjs.org/${name}/-/${unscoped}-${version}.tgz`
}
function npmPage(name, version) {
  return `https://www.npmjs.com/package/${name}/v/${version}`
}

const sorted = [...rows].sort((a, b) =>
  a.name.localeCompare(b.name) || a.minorLine.localeCompare(b.minorLine, undefined, { numeric: true }))

const header = ['package', 'targetVersion', 'minorLine', 'npmPageUrl', 'npmTarballUrl', 'publishedAt', 'frameworkDep', 'alreadyBundled']
const lines = [header.join(',')]
for (const r of sorted) {
  lines.push([
    r.name,
    r.targetVersion,
    r.minorLine,
    npmPage(r.name, r.targetVersion),
    tarballUrl(r.name, r.targetVersion),
    r.publishedAt || '',
    r.frameworkDep || '',
    r.alreadyBundled,
  ].join(','))
}
const out = path.resolve(__dirname, 'target-bundles-with-npm-links.csv')
fs.writeFileSync(out, lines.join('\n') + '\n')
console.log(`Wrote ${out}`)
console.log(`Rows (excl. header): ${sorted.length}`)
console.log('\nHeader:', header.join(', '))
console.log('\nSample (first 4):')
for (const l of lines.slice(1, 5)) console.log('  ' + l)
