#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, curr, i, arr) => {
        if (curr.startsWith('--')) acc.push([curr.slice(2), arr[i + 1]])
        return acc
    }, []),
)

const required = ['current', 'history', 'label', 'runUrl']
for (const key of required) {
    if (!args[key]) {
        console.error(`missing --${key}`)
        process.exit(2)
    }
}

const THRESHOLD_PCT = Number(args.threshold ?? 25)
const CONSECUTIVE = Number(args.consecutive ?? 3)
const WEBHOOK_URL = process.env.BETTERSTACK_WEBHOOK_URL

const DIMENSIONS = [
    { name: 'latency p90', unit: 's', get: (r) => r.latency.p90Sec },
    { name: 'latency p99', unit: 's', get: (r) => r.latency.p99Sec },
    { name: 'throughput', unit: 'req/s', get: (r) => r.throughput.reqSec, invert: true },
    { name: 'worker cpu p95', unit: '%', get: (r) => r.resources?.worker?.cpuPct?.p95 ?? 0 },
    { name: 'worker mem max', unit: 'MB', get: (r) => r.resources?.worker?.memMb?.max ?? 0 },
    { name: 'app cpu p95', unit: '%', get: (r) => r.resources?.app?.cpuPct?.p95 ?? 0 },
    { name: 'app mem max', unit: 'MB', get: (r) => r.resources?.app?.memMb?.max ?? 0 },
]

const current = JSON.parse(readFileSync(args.current, 'utf8'))
const historyPaths = args.history.split(',').filter(Boolean)
const history = historyPaths.map((p) => JSON.parse(readFileSync(p, 'utf8')))

function median(values) {
    const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
    if (sorted.length === 0) return 0
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function shiftPct({ current, baseline, invert }) {
    if (baseline === 0) return 0
    const raw = ((current - baseline) / baseline) * 100
    return invert ? -raw : raw
}

const results = []
for (const dim of DIMENSIONS) {
    const currentValue = dim.get(current)
    const historyValues = history.map(dim.get)
    const baseline = median(historyValues)
    const pct = shiftPct({ current: currentValue, baseline, invert: dim.invert })

    const recentValues = history.slice(-Math.max(0, CONSECUTIVE - 1)).map(dim.get)
    const recentShifts = recentValues.map((v) => shiftPct({ current: v, baseline, invert: dim.invert }))
    const consecutiveBreach = pct > THRESHOLD_PCT
        && recentShifts.length >= CONSECUTIVE - 1
        && recentShifts.every((s) => s > THRESHOLD_PCT)

    results.push({ name: dim.name, unit: dim.unit, currentValue, baseline, pct, breach: consecutiveBreach })
}

const breaches = results.filter((r) => r.breach)
const summary = {
    label: args.label,
    threshold: THRESHOLD_PCT,
    consecutive: CONSECUTIVE,
    historyCount: history.length,
    dimensions: results,
    breachCount: breaches.length,
}
process.stdout.write(JSON.stringify(summary, null, 2) + '\n')

if (history.length < CONSECUTIVE) {
    console.error(`History has ${history.length} entries (< ${CONSECUTIVE}); need more baselines before firing.`)
    process.exit(0)
}

if (breaches.length === 0) {
    console.error(`No regressions on ${args.label}.`)
    process.exit(0)
}

if (!WEBHOOK_URL) {
    console.error(`BREACH on ${args.label} but BETTERSTACK_WEBHOOK_URL unset — skipping alert.`)
    process.exit(0)
}

const lines = breaches.map((b) => `- **${b.name}**: ${b.currentValue.toFixed(2)} ${b.unit} (baseline ${b.baseline.toFixed(2)}, +${b.pct.toFixed(1)}%)`)
const cause = `Benchmark regression on \`${args.label}\` — ${breaches.length} dimension(s) above ${THRESHOLD_PCT}% for ${CONSECUTIVE} consecutive runs:\n\n${lines.join('\n')}\n\n[Run details →](${args.runUrl})\n\nSHA: \`${current.meta.sha}\``

const payload = {
    name: `Bench regression: ${args.label}`,
    cause,
    alertId: `bench-${args.label}-${breaches.map((b) => b.name.replace(/\s+/g, '_')).join('-')}`,
    state: 'alert',
}

const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
})
if (!res.ok) {
    console.error(`Betterstack webhook responded ${res.status}: ${await res.text().catch(() => '')}`)
    process.exit(1)
}
console.error(`Alerted Betterstack (${res.status}) on ${breaches.length} dimension(s).`)
