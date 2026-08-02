import { appendFileSync } from 'node:fs'
import { v8IsolateCodeSandbox } from '../core/code/v8-isolate-code-sandbox'

const LOG_PATH = '/tmp/ap-mem-bench.jsonl'
const SAMPLE_INTERVAL_MS = 5

let timer: NodeJS.Timeout | null = null
let runPeakRssKb = 0
let runPeakHeapKb = 0

function isEnabled(): boolean {
    return process.env.AP_MEM_BENCH === 'true'
}

function variant(): string {
    const sandbox: Record<string, unknown> = v8IsolateCodeSandbox
    return typeof sandbox['createScriptSession'] === 'function' ? 'after' : 'before'
}

function sample(): void {
    const usage = process.memoryUsage()
    runPeakRssKb = Math.max(runPeakRssKb, usage.rss / 1024)
    runPeakHeapKb = Math.max(runPeakHeapKb, usage.heapUsed / 1024)
}

function write(entry: Record<string, unknown>): void {
    try {
        appendFileSync(LOG_PATH, JSON.stringify({ variant: variant(), mode: process.env.AP_EXECUTION_MODE, pid: process.pid, at: new Date().toISOString(), ...entry }) + '\n')
    }
    catch {
        // best-effort bench logging
    }
}

function mb(kb: number): number {
    return Math.round(kb / 1024 * 10) / 10
}

export const memBench = {
    runStart(operationType: string): void {
        if (!isEnabled()) {
            return
        }
        runPeakRssKb = 0
        runPeakHeapKb = 0
        sample()
        write({ t: 'run-start', operationType, rssMb: mb(process.memoryUsage().rss / 1024) })
        if (timer === null) {
            timer = setInterval(sample, SAMPLE_INTERVAL_MS)
            timer.unref()
        }
    },

    runEnd(operationType: string): void {
        if (!isEnabled()) {
            return
        }
        sample()
        if (timer !== null) {
            clearInterval(timer)
            timer = null
        }
        write({
            t: 'run-end',
            operationType,
            maxRssMb: mb(process.resourceUsage().maxRSS),
            runPeakRssMb: mb(runPeakRssKb),
            runPeakHeapMb: mb(runPeakHeapKb),
            endRssMb: mb(process.memoryUsage().rss / 1024),
            endHeapMb: mb(process.memoryUsage().heapUsed / 1024),
        })
    },
}
