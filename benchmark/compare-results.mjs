#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { benchmarkMetrics } from './dimensions.mjs'

const { DIMENSIONS, median, shiftPct } = benchmarkMetrics

function renderComparison({ dir, baselineImage, candidateImage }) {
    const files = readdirSync(dir)
    const runs = loadRuns({ dir, files, pattern: /^(light|heavy)-(baseline|candidate)-(\d+)\.json$/ })
    const idle = loadRuns({ dir, files, pattern: /^(idle)-(baseline|candidate)-(\d+)\.json$/ })
    if (runs.length === 0) {
        throw new Error(`no result files in ${dir}`)
    }
    const rounds = new Set(runs.map((r) => r.round)).size
    const flows = ['light', 'heavy'].filter((flow) => runs.some((r) => r.flow === flow))

    return [
        '## Benchmark: candidate against baseline',
        '',
        'Report only. This check does not block the approval. The noise between two runs of one image is not measured yet, so a change here can be noise.',
        '',
        `- Baseline: \`${baselineImage ?? 'baseline'}\``,
        `- Candidate: \`${candidateImage ?? 'candidate'}\``,
        `- ${rounds} round(s) per side on one runner. Each value is the median of the rounds.`,
        '',
        ...failureWarnings({ runs, flows }),
        ...flows.flatMap((flow) => renderFlow({ flow, runs: runs.filter((r) => r.flow === flow) })),
        ...renderIdle({ idle }),
    ].join('\n') + '\n'
}

function loadRuns({ dir, files, pattern }) {
    return files.flatMap((file) => {
        const match = pattern.exec(file)
        if (!match) return []
        const [, flow, side, round] = match
        return [{ flow, side, round: Number(round), data: JSON.parse(readFileSync(join(dir, file), 'utf8')) }]
    })
}

function failureWarnings({ runs, flows }) {
    const warnings = flows.flatMap((flow) => {
        const failed = (side) => runs
            .filter((r) => r.flow === flow && r.side === side)
            .reduce((sum, r) => sum + (r.data.counts?.failed ?? 0), 0)
        const candidate = failed('candidate')
        const baseline = failed('baseline')
        if (candidate <= baseline) return []
        return [`> **Warning:** the candidate failed ${candidate} request(s) on the ${flow} flow; the baseline failed ${baseline}.`, '']
    })
    return warnings
}

function renderFlow({ flow, runs }) {
    const failedRow = {
        name: 'failed requests (sum)',
        baseline: sumBy({ runs, side: 'baseline', get: (r) => r.counts?.failed ?? 0 }),
        candidate: sumBy({ runs, side: 'candidate', get: (r) => r.counts?.failed ?? 0 }),
    }
    const rows = DIMENSIONS.map((dim) => ({
        name: `${dim.name} (${dim.unit})`,
        baseline: medianBy({ runs, side: 'baseline', get: dim.get }),
        candidate: medianBy({ runs, side: 'candidate', get: dim.get }),
        invert: dim.invert,
    }))
    return [`### ${flow} flow`, '', ...renderTable([...rows, failedRow]), '']
}

function renderIdle({ idle }) {
    if (idle.length === 0) return []
    const dims = [
        { name: 'app cpu p50 (%)', get: (s) => s.app?.cpuPct?.p50 ?? 0 },
        { name: 'app mem max (MB)', get: (s) => s.app?.memMb?.max ?? 0 },
        { name: 'worker cpu p50 (%)', get: (s) => s.worker?.cpuPct?.p50 ?? 0 },
        { name: 'worker mem max (MB)', get: (s) => s.worker?.memMb?.max ?? 0 },
    ]
    const rows = dims.map((dim) => ({
        name: dim.name,
        baseline: medianBy({ runs: idle, side: 'baseline', get: dim.get }),
        candidate: medianBy({ runs: idle, side: 'candidate', get: dim.get }),
    }))
    return ['### Idle, after the load', '', ...renderTable(rows), '']
}

function renderTable(rows) {
    return [
        '| Metric | Baseline | Candidate | Change |',
        '|---|---:|---:|---|',
        ...rows.map((row) => `| ${row.name} | ${format(row.baseline)} | ${format(row.candidate)} | ${describeChange(row)} |`),
    ]
}

function describeChange({ baseline, candidate, invert }) {
    if (baseline === 0) return candidate === 0 ? 'same' : 'new'
    const shift = shiftPct({ current: candidate, baseline, invert })
    if (Math.abs(shift) < 0.05) return 'same'
    return `${Math.abs(shift).toFixed(1)}% ${shift > 0 ? 'worse' : 'better'}`
}

function medianBy({ runs, side, get }) {
    return median(runs.filter((r) => r.side === side).map((r) => get(r.data)))
}

function sumBy({ runs, side, get }) {
    return runs.filter((r) => r.side === side).reduce((sum, r) => sum + get(r.data), 0)
}

function format(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [dir, baselineImage, candidateImage] = process.argv.slice(2)
    if (!dir) {
        console.error('usage: compare-results.mjs <dir> [baselineImage] [candidateImage]')
        process.exit(2)
    }
    process.stdout.write(renderComparison({ dir, baselineImage, candidateImage }))
}

export const compareResults = { renderComparison }
