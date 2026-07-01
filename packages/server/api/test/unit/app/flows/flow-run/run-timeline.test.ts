import { describe, expect, it } from 'vitest'
import { buildRunTimeline } from '../../../../../src/app/flows/flow-run/run-timeline'

function phases(timeline: ReturnType<typeof buildRunTimeline>) {
    return Object.fromEntries(
        (timeline?.legs[0] ?? []).map((p) => [p.name, p.durationMs]),
    )
}

describe('buildRunTimeline', () => {
    it('decomposes a real cold run: queue is the remainder, run matches Took', () => {
        // The exact run captured from a live cold execution (created -> startTime = 185ms,
        // finishTime - startTime = 35ms = "Took"), worker measured provision=16, boot=121.
        const timeline = buildRunTimeline({
            created: '2026-06-30T09:24:38.876Z',
            startTime: '2026-06-30T09:24:39.061Z',
            finishTime: '2026-06-30T09:24:39.096Z',
            provisionMs: 16,
            bootMs: 121,
            runMs: 81,
        })
        expect(phases(timeline)).toEqual({
            QUEUE: 48,
            PROVISION: 16,
            BOOT: 121,
            RUN: 35,
        })
        // Phases before RUN sum exactly to (startTime - created).
        expect(48 + 16 + 121).toBe(185)
    })

    it('warm run: boot passes through as ~0', () => {
        const timeline = buildRunTimeline({
            created: '2026-06-30T10:00:00.000Z',
            startTime: '2026-06-30T10:00:00.050Z',
            finishTime: '2026-06-30T10:00:00.090Z',
            provisionMs: 13,
            bootMs: 0,
            runMs: 7,
        })
        expect(phases(timeline)).toEqual({
            QUEUE: 37,
            PROVISION: 13,
            BOOT: 0,
            RUN: 40,
        })
    })

    it('falls back to worker runMs before finishTime lands', () => {
        const timeline = buildRunTimeline({
            created: '2026-06-30T10:00:00.000Z',
            startTime: '2026-06-30T10:00:00.050Z',
            finishTime: null,
            provisionMs: 13,
            bootMs: 0,
            runMs: 7,
        })
        expect(phases(timeline).RUN).toBe(7)
    })

    it('clamps queue to zero when provision+boot exceed the startup window', () => {
        const timeline = buildRunTimeline({
            created: '2026-06-30T10:00:00.000Z',
            startTime: '2026-06-30T10:00:00.030Z',
            finishTime: '2026-06-30T10:00:00.040Z',
            provisionMs: 20,
            bootMs: 50,
            runMs: 10,
        })
        expect(phases(timeline).QUEUE).toBe(0)
    })

    it('never overwrites an existing timeline (leg-0 only / resume-safe)', () => {
        const result = buildRunTimeline({
            existingTimeline: { legs: [[{ name: 'RUN', durationMs: 1 }]] },
            created: '2026-06-30T10:00:00.000Z',
            startTime: '2026-06-30T10:00:00.050Z',
            finishTime: '2026-06-30T10:00:00.090Z',
            provisionMs: 13,
            bootMs: 0,
            runMs: 7,
        })
        expect(result).toBeUndefined()
    })

    it('returns undefined until all worker timings are present', () => {
        expect(buildRunTimeline({
            created: '2026-06-30T10:00:00.000Z',
            startTime: '2026-06-30T10:00:00.050Z',
            provisionMs: 13,
            bootMs: 0,
            // runMs missing
        })).toBeUndefined()
    })

    it('returns undefined when timestamps are missing', () => {
        expect(buildRunTimeline({
            startTime: '2026-06-30T10:00:00.050Z',
            provisionMs: 13,
            bootMs: 0,
            runMs: 7,
            // created missing
        })).toBeUndefined()
    })
})
