#!/usr/bin/env node
// Phase A — Target-list generator.
// 1. Enumerate piece npm names from the repo worktree.
// 2. For each, fetch the npm registry doc and list every published version.
// 3. Collapse versions to major.minor -> latest patch (the migration target per minor line).
// 4. Capture each target's declared @activepieces/pieces-framework dep range (skew evidence).
// Output: target-list.json + summary printed to stdout.

const fs = require('node:fs')
const path = require('node:path')

const REPO = process.argv[2] || path.resolve(__dirname, '..', '..', '..') // repo root (tools/retro-bundle/targets -> up 3)
const OUT = path.resolve(__dirname, 'target-list.json')
const CONCURRENCY = 24

function listPieceNames(repo) {
  const roots = [
    path.join(repo, 'packages', 'pieces', 'community'),
    path.join(repo, 'packages', 'pieces', 'core'),
  ]
  const names = new Map() // npmName -> repoVersion
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const pkgPath = path.join(root, entry.name, 'package.json')
      if (!fs.existsSync(pkgPath)) continue
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.name && pkg.name.startsWith('@activepieces/piece-')) {
          names.set(pkg.name, pkg.version || null)
        }
      } catch { /* skip unreadable */ }
    }
  }
  return names
}

function semverParts(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) return null
  return { major: +m[1], minor: +m[2], patch: +m[3] }
}

async function fetchRegistry(name) {
  const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (res.status === 404) return { notFound: true }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function collapse(doc) {
  const versions = Object.keys(doc.versions || {})
  const time = doc.time || {}
  const minorMap = new Map() // "maj.min" -> {patch, version}
  let parseFails = 0
  for (const v of versions) {
    const p = semverParts(v)
    if (!p) { parseFails++; continue }
    // skip prerelease / beta tags for the target line
    if (/-/.test(v)) continue
    const key = `${p.major}.${p.minor}`
    const cur = minorMap.get(key)
    if (!cur || p.patch > cur.patch) minorMap.set(key, { patch: p.patch, version: v })
  }
  const targets = [...minorMap.entries()]
    .map(([minor, { version }]) => {
      const man = doc.versions[version] || {}
      const fwDep =
        (man.dependencies && man.dependencies['@activepieces/pieces-framework']) ||
        (man.peerDependencies && man.peerDependencies['@activepieces/pieces-framework']) ||
        null
      const commonDep =
        (man.dependencies && man.dependencies['@activepieces/pieces-common']) || null
      return {
        minorLine: minor,
        targetVersion: version,
        publishedAt: time[version] || null,
        frameworkDep: fwDep,
        commonDep,
        depCount: man.dependencies ? Object.keys(man.dependencies).length : 0,
      }
    })
    .sort((a, b) => {
      const pa = semverParts(a.targetVersion), pb = semverParts(b.targetVersion)
      return pa.major - pb.major || pa.minor - pb.minor
    })
  return {
    totalPublished: versions.length,
    stableCount: versions.filter((v) => !/-/.test(v) && semverParts(v)).length,
    minorLines: targets.length,
    parseFails,
    targets,
  }
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length)
  let i = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

async function main() {
  const names = listPieceNames(REPO)
  const list = [...names.entries()]
  console.error(`Enumerated ${list.length} piece npm packages from repo. Scanning npm...`)
  let done = 0
  const out = await pool(list, async ([name, repoVersion]) => {
    try {
      const doc = await fetchRegistry(name)
      done++
      if (done % 50 === 0) console.error(`  ...${done}/${list.length}`)
      if (doc.notFound) return { name, repoVersion, npmStatus: 'not-published' }
      const c = collapse(doc)
      return { name, repoVersion, npmStatus: 'ok', ...c }
    } catch (e) {
      done++
      return { name, repoVersion, npmStatus: 'error', error: e.message }
    }
  }, CONCURRENCY)

  const published = out.filter((p) => p.npmStatus === 'ok')
  const totalVersions = published.reduce((s, p) => s + p.totalPublished, 0)
  const totalStable = published.reduce((s, p) => s + p.stableCount, 0)
  const totalTargets = published.reduce((s, p) => s + p.minorLines, 0)

  const summary = {
    generatedFrom: REPO,
    piecesInRepo: list.length,
    piecesPublishedOnNpm: published.length,
    piecesNotPublished: out.filter((p) => p.npmStatus === 'not-published').length,
    piecesErrored: out.filter((p) => p.npmStatus === 'error').length,
    totalPublishedVersions: totalVersions,
    totalStableVersions: totalStable,
    totalMinorLineTargets: totalTargets,
    reductionRatio: totalStable ? +(totalStable / totalTargets).toFixed(2) : null,
  }
  fs.writeFileSync(OUT, JSON.stringify({ summary, pieces: out }, null, 2))
  console.error('\n===== SUMMARY =====')
  console.error(JSON.stringify(summary, null, 2))
  console.error(`\nWrote ${OUT}`)
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
