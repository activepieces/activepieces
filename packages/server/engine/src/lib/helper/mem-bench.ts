import { appendFileSync } from 'node:fs'
import { v8IsolateCodeSandbox } from '../core/code/v8-isolate-code-sandbox'

const LOG_PATH = '/tmp/ap-mem-bench.jsonl'
const SAMPLE_INTERVAL_MS = 5

type StepFrame = {
    name: string
    startRssKb: number
    startHeapKb: number
    peakRssKb: number
    peakHeapKb: number
    startedAt: number
}

let timer: NodeJS.Timeout | null = null
let runPeakRssKb = 0
let runPeakHeapKb = 0
const stepStack: StepFrame[] = []

function variant(): string {
    const sandbox: Record<string, unknown> = v8IsolateCodeSandbox
    return typeof sandbox['createScriptSession'] === 'function' ? 'after' : 'before'
}

function sample(): void {
    const usage = process.memoryUsage()
    const rssKb = usage.rss / 1024
    const heapKb = usage.heapUsed / 1024
    runPeakRssKb = Math.max(runPeakRssKb, rssKb)
    runPeakHeapKb = Math.max(runPeakHeapKb, heapKb)
    for (const frame of stepStack) {
        frame.peakRssKb = Math.max(frame.peakRssKb, rssKb)
        frame.peakHeapKb = Math.max(frame.peakHeapKb, heapKb)
    }
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
        runPeakRssKb = 0
        runPeakHeapKb = 0
        stepStack.length = 0
        sample()
        write({ t: 'run-start', operationType, rssMb: mb(process.memoryUsage().rss / 1024) })
        if (timer === null) {
            timer = setInterval(sample, SAMPLE_INTERVAL_MS)
            timer.unref()
        }
    },

    runEnd(operationType: string): void {
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

    stepStart(stepName: string): void {
        const usage = process.memoryUsage()
        const frame: StepFrame = {
            name: stepName,
            startRssKb: usage.rss / 1024,
            startHeapKb: usage.heapUsed / 1024,
            peakRssKb: usage.rss / 1024,
            peakHeapKb: usage.heapUsed / 1024,
            startedAt: Date.now(),
        }
        stepStack.push(frame)
        sample()
    },

    stepEnd(stepName: string, stepType: string): void {
        sample()
        const frame = stepStack.pop()
        if (frame === undefined || frame.name !== stepName) {
            return
        }
        write({
            t: 'step-end',
            step: stepName,
            stepType,
            durationMs: Date.now() - frame.startedAt,
            stepPeakRssMb: mb(frame.peakRssKb),
            stepPeakHeapMb: mb(frame.peakHeapKb),
            rssDeltaDuringStepMb: mb(frame.peakRssKb - frame.startRssKb),
            heapDeltaDuringStepMb: mb(frame.peakHeapKb - frame.startHeapKb),
            endRssMb: mb(process.memoryUsage().rss / 1024),
        })
    },
}
