// Convert deepsec's per-file analysis JSONs into a single SARIF 2.1.0 file
// suitable for `github/codeql-action/upload-sarif`.
//
// Usage:
//   node .deepsec/scripts/deepsec-to-sarif.mjs <data-dir> <out-sarif-path>
//
// <data-dir>  = .deepsec/data  (root of per-project analysis state)
// <out>       = ./deepsec.sarif
//
// Reads every `data/<id>/files/**/*.json`, picks up its `findings[]`, drops
// false-positives marked by revalidate, and emits SARIF.

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const [, , dataDir = '.deepsec/data', outPath = 'deepsec.sarif'] = process.argv

// Severities NOT in these maps (BUG, LOW) are intentionally skipped so the
// Security tab only shows actionable security tier alerts.
const SEVERITY_TO_SARIF_LEVEL = {
  CRITICAL: 'error',
  HIGH: 'error',
  HIGH_BUG: 'warning',
  MEDIUM: 'warning',
}

const SEVERITY_TO_SCORE = {
  CRITICAL: '9.5',
  HIGH: '8.0',
  HIGH_BUG: '6.5',
  MEDIUM: '5.5',
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (entry.endsWith('.json')) yield full
  }
}

const results = []
const rules = new Map()

if (!existsSync(dataDir)) {
  console.warn(`Data dir ${dataDir} not found; writing empty SARIF.`)
}

for (const projectId of existsSync(dataDir) ? readdirSync(dataDir) : []) {
  const filesDir = join(dataDir, projectId, 'files')
  try { statSync(filesDir) } catch { continue }

  for (const jsonPath of walk(filesDir)) {
    let analysis
    try {
      analysis = JSON.parse(readFileSync(jsonPath, 'utf8'))
    } catch (err) {
      console.warn(`Skipping ${jsonPath}: ${err.message}`)
      continue
    }
    if (!analysis.findings || analysis.findings.length === 0) continue

    const sourceRel = relative(join(dataDir, projectId, 'files'), jsonPath)
      .replace(/\.json$/, '')
    const repoUri = `packages/${projectId.replace(/-/g, '/')}/${sourceRel}`

    for (const finding of analysis.findings) {
      if (finding.revalidation?.verdict === 'false-positive') continue
      if (!SEVERITY_TO_SARIF_LEVEL[finding.severity]) continue // skip BUG / LOW

      const ruleId = finding.vulnSlug ?? 'unknown'
      if (!rules.has(ruleId)) {
        rules.set(ruleId, {
          id: ruleId,
          name: ruleId,
          shortDescription: { text: finding.title ?? ruleId },
          helpUri: 'https://github.com/vercel-labs/deepsec',
        })
      }

      const sortedLines = (finding.lineNumbers ?? [])
        .filter((n) => Number.isInteger(n) && n >= 1)
        .sort((a, b) => a - b)
      const startLine = sortedLines[0] ?? 1
      const endLine = sortedLines.at(-1) ?? startLine

      results.push({
        ruleId,
        level: SEVERITY_TO_SARIF_LEVEL[finding.severity],
        message: {
          text: `[${finding.severity}] ${finding.title}\n\n${finding.description ?? ''}\n\nRecommendation: ${finding.recommendation ?? '(none)'}`,
        },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: repoUri },
            region: { startLine, endLine },
          },
        }],
        properties: {
          'security-severity': SEVERITY_TO_SCORE[finding.severity],
          project: projectId,
          ...(finding.confidence != null && { confidence: finding.confidence }),
          ...(finding.revalidation?.verdict != null && { revalidation: finding.revalidation.verdict }),
        },
      })
    }
  }
}

const sarif = {
  $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
  version: '2.1.0',
  runs: [{
    tool: {
      driver: {
        name: 'deepsec',
        informationUri: 'https://github.com/vercel-labs/deepsec',
        rules: [...rules.values()],
      },
    },
    results,
  }],
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(sarif, null, 2))
console.log(`Wrote ${results.length} findings (${rules.size} unique rules) to ${outPath}`)
