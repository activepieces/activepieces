#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const INPUT = process.argv[2]
if (!INPUT) {
    console.error('usage: aggregate-stats.mjs <stats.jsonl>')
    process.exit(2)
}

const raw = readFileSync(INPUT, 'utf8').split('\n').filter(Boolean)
const samples = []
for (const line of raw) {
    try {
        samples.push(JSON.parse(line))
    }
    catch {
        // skip malformed lines (docker stats occasionally interleaves)
    }
}

function parseMemUsageMB(memUsage) {
    const first = memUsage.split('/')[0].trim()
    const match = first.match(/^([0-9.]+)\s*(GiB|MiB|KiB|B)$/)
    if (!match) return 0
    const value = Number(match[1])
    switch (match[2]) {
    case 'GiB': return value * 1024
    case 'MiB': return value
    case 'KiB': return value / 1024
    case 'B': return value / (1024 * 1024)
    default: return 0
    }
}

function parseCpuPct(cpuPerc) {
    return Number(cpuPerc.replace('%', '')) || 0
}

function classify(name) {
    if (name.includes('-worker-') || name.endsWith('-worker')) return 'worker'
    if (name.includes('-app-') || name.endsWith('-app')) return 'app'
    return 'other'
}

function quantile(sorted, q) {
    if (sorted.length === 0) return 0
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1))))
    return sorted[idx]
}

const buckets = { app: { cpu: [], mem: [] }, worker: { cpu: [], mem: [] } }
for (const s of samples) {
    const role = classify(s.Name || '')
    if (role === 'other') continue
    buckets[role].cpu.push(parseCpuPct(s.CPUPerc || '0%'))
    buckets[role].mem.push(parseMemUsageMB(s.MemUsage || '0MiB'))
}

function summarize(values) {
    if (values.length === 0) return { samples: 0, max: 0, p95: 0, p50: 0 }
    const sorted = [...values].sort((a, b) => a - b)
    return {
        samples: sorted.length,
        max: sorted[sorted.length - 1],
        p95: quantile(sorted, 0.95),
        p50: quantile(sorted, 0.5),
    }
}

const summary = {
    app: { cpuPct: summarize(buckets.app.cpu), memMb: summarize(buckets.app.mem) },
    worker: { cpuPct: summarize(buckets.worker.cpu), memMb: summarize(buckets.worker.mem) },
}

process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
