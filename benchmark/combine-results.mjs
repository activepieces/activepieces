#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'

const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, curr, i, arr) => {
        if (curr.startsWith('--')) acc.push([curr.slice(2), arr[i + 1]])
        return acc
    }, []),
)

const required = ['report', 'stats', 'sha', 'label', 'runId', 'out']
for (const key of required) {
    if (!args[key]) {
        console.error(`missing --${key}`)
        process.exit(2)
    }
}

const report = JSON.parse(readFileSync(args.report, 'utf8'))
const stats = JSON.parse(readFileSync(args.stats, 'utf8'))

const run = report.runs?.[0]
if (!run) {
    console.error('report.runs[0] missing — CLI produced no phase results')
    process.exit(1)
}

const s = run.summary ?? {}
const t = run.timeline ?? {}

const result = {
    schemaVersion: 2,
    meta: {
        ts: new Date().toISOString(),
        sha: args.sha,
        label: args.label,
        runId: args.runId,
        loader: 'activepieces-cli',
        cliTarget: report.meta?.target,
        flowId: report.flowId,
        connections: run.connections,
        requests: run.requests,
    },
    latency: {
        p50Ms: s.p50Ms ?? 0,
        p90Ms: s.p90Ms ?? 0,
        p99Ms: s.p99Ms ?? 0,
        meanMs: s.latencyMeanMs ?? 0,
        minMs: s.minMs ?? 0,
        maxMs: s.maxMs ?? 0,
    },
    throughput: { reqSec: s.throughputReqSec ?? 0 },
    counts: { ok2xx: s.ok2xx ?? 0, failed: s.failed ?? 0, errors: s.errors ?? 0, timeouts: s.timeouts ?? 0 },
    timeline: {
        sampleCount: t.sampleCount ?? 0,
        queueWaitP50Ms: t.queueWaitP50 ?? 0,
        queueWaitP90Ms: t.queueWaitP90 ?? 0,
        serviceP50Ms: t.serviceP50 ?? 0,
        serviceP90Ms: t.serviceP90 ?? 0,
        queueMaxMs: t.queueMax ?? 0,
        provisionP50Ms: t.provisionP50 ?? 0,
        bootP50Ms: t.bootP50 ?? 0,
        rateLimitedRuns: t.rateLimitedRunsCount ?? 0,
    },
    resources: stats,
}

writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n')
console.error(`Wrote ${args.out}`)
