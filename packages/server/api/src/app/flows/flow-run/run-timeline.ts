import { isNil } from '@activepieces/core-utils'
import { RunTimeline } from '@activepieces/shared'

// Assembles the leg-0 latency breakdown from the run timestamps + worker-measured phase durations.
// Pure and dependency-free so the phase math stays unit-testable in isolation.
//   QUEUE = the remainder of (startTime - created) once provision and boot are removed.
//   RUN   = finishTime - startTime (matches the run's displayed "Took"); falls back to the worker's
//           sandboxRun wall clock (runMs) until finishTime lands.
// Returns undefined (skip the write) until all inputs are present, and never overwrites an existing
// timeline so a resumed run keeps its first leg.
export function buildRunTimeline({
    existingTimeline,
    created,
    startTime,
    finishTime,
    provisionMs,
    bootMs,
    runMs,
}: BuildRunTimelineParams): RunTimeline | undefined {
    if (!isNil(existingTimeline)) {
        return undefined
    }
    if (isNil(provisionMs) || isNil(bootMs) || isNil(runMs)) {
        return undefined
    }
    if (isNil(created) || isNil(startTime)) {
        return undefined
    }
    const startupMs = new Date(startTime).getTime() - new Date(created).getTime()
    const queueMs = Math.max(0, startupMs - provisionMs - bootMs)
    const runDurationMs = isNil(finishTime)
        ? runMs
        : Math.max(0, new Date(finishTime).getTime() - new Date(startTime).getTime())
    return {
        legs: [[
            { name: 'QUEUE', durationMs: queueMs },
            { name: 'PROVISION', durationMs: provisionMs },
            { name: 'BOOT', durationMs: bootMs },
            { name: 'RUN', durationMs: runDurationMs },
        ]],
    }
}

type BuildRunTimelineParams = {
    existingTimeline?: RunTimeline | null
    created?: string | null
    startTime?: string | null
    finishTime?: string | null
    provisionMs?: number
    bootMs?: number
    runMs?: number
}
