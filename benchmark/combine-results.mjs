#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'

const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, curr, i, arr) => {
        if (curr.startsWith('--')) acc.push([curr.slice(2), arr[i + 1]])
        return acc
    }, []),
)

const required = ['hey', 'stats', 'sha', 'label', 'runId', 'out']
for (const key of required) {
    if (!args[key]) {
        console.error(`missing --${key}`)
        process.exit(2)
    }
}

const hey = JSON.parse(readFileSync(args.hey, 'utf8'))
const stats = JSON.parse(readFileSync(args.stats, 'utf8'))

const toNum = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
}

const result = {
    schemaVersion: 1,
    meta: {
        ts: new Date().toISOString(),
        sha: args.sha,
        label: args.label,
        runId: args.runId,
        loader: 'hey',
    },
    latency: {
        p50Sec: toNum(hey.p50),
        p75Sec: toNum(hey.p75),
        p90Sec: toNum(hey.p90),
        p99Sec: toNum(hey.p99),
        meanSec: toNum(hey.mean_latency),
        fastestSec: toNum(hey.fastest),
        slowestSec: toNum(hey.slowest),
    },
    throughput: { reqSec: toNum(hey.throughput) },
    counts: { ok200: toNum(hey.ok_count) },
    resources: stats,
}

writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n')
console.error(`Wrote ${args.out}`)
