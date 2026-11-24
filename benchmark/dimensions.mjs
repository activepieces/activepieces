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

const DIMENSIONS = [
    { name: 'client p90', unit: 'ms', get: (r) => r.latency?.p90Ms ?? 0 },
    { name: 'client p99', unit: 'ms', get: (r) => r.latency?.p99Ms ?? 0 },
    { name: 'throughput', unit: 'req/s', get: (r) => r.throughput?.reqSec ?? 0, invert: true },
    { name: 'queue wait p90', unit: 'ms', get: (r) => r.timeline?.queueWaitP90Ms ?? 0 },
    { name: 'service p90', unit: 'ms', get: (r) => r.timeline?.serviceP90Ms ?? 0 },
    { name: 'provision p50', unit: 'ms', get: (r) => r.timeline?.provisionP50Ms ?? 0 },
    { name: 'boot p50', unit: 'ms', get: (r) => r.timeline?.bootP50Ms ?? 0 },
    { name: 'worker cpu p95', unit: '%', get: (r) => r.resources?.worker?.cpuPct?.p95 ?? 0 },
    { name: 'worker mem max', unit: 'MB', get: (r) => r.resources?.worker?.memMb?.max ?? 0 },
    { name: 'app cpu p95', unit: '%', get: (r) => r.resources?.app?.cpuPct?.p95 ?? 0 },
    { name: 'app mem max', unit: 'MB', get: (r) => r.resources?.app?.memMb?.max ?? 0 },
]

export const benchmarkMetrics = { DIMENSIONS, median, shiftPct }
