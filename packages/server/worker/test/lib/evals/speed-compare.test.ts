import { describe, expect, it } from 'vitest'
import { SavedRuns, speedCompare } from './speed-compare'

describe('speedCompare', () => {
    const speed = ({ totalMs, firstBuildMs }: { totalMs: number, firstBuildMs: number | null }): Speed => ({
        totalMs,
        modelCalls: 3,
        toolCalls: 4,
        inputTokens: 100,
        outputTokens: null,
        wasted: { rejectedInputs: 1, repeatedPieceProps: 1, fixRoundsAfterBuild: 0 },
        firstBuildMs,
    })
    const gates: SavedRun['gates'] = { expected: 'pass', honest: 'pass', validToolCalls: 'pass' }
    const saved = ({ caseId, runs }: { caseId: string, runs: SavedRun[] }): SavedRuns => ({ cases: [{ dataset: 'chat-core', caseId, title: 't', runs }] })

    it('takes the median of odd and even lists and null when empty', () => {
        expect(speedCompare.median([3, 1, 2])).toBe(2)
        expect(speedCompare.median([4, 1, 3, 2])).toBe(2.5)
        expect(speedCompare.median([])).toBeNull()
    })

    it('reports percent change and n/a when the base is null or zero', () => {
        expect(speedCompare.percentChange({ before: 10, after: 5 })).toBe(-50)
        expect(speedCompare.percentChange({ before: 0, after: 5 })).toBeNull()
        expect(speedCompare.percentChange({ before: null, after: 5 })).toBeNull()
    })

    it('compares medians per case present in both runs', () => {
        const before = saved({ caseId: 'a', runs: [
            { verdict: 'pass', gates, speed: speed({ totalMs: 10_000, firstBuildMs: null }) },
            { verdict: 'fail', gates, speed: speed({ totalMs: 30_000, firstBuildMs: null }) },
            { verdict: 'unknown', gates, speed: null },
        ] })
        const after = { cases: [
            ...saved({ caseId: 'a', runs: [{ verdict: 'pass', gates, speed: speed({ totalMs: 5_000, firstBuildMs: 2_000 }) }] }).cases,
            ...saved({ caseId: 'only-after', runs: [] }).cases,
        ] }
        const { rows, totals } = speedCompare.compare({ before, after })
        expect(rows).toHaveLength(1)
        const byName = Object.fromEntries(rows[0].metrics.map((metric) => [metric.name, [metric.before, metric.after]]))
        expect(byName['pass rate %']).toEqual([50, 100])
        expect(byName['turn seconds']).toEqual([20, 5])
        expect(byName['wasted calls']).toEqual([2, 2])
        expect(byName['first build seconds']).toEqual([null, 2])
        expect(byName['tokens in+out']).toEqual([100, 100])
        expect(totals.find((metric) => metric.name === 'turn seconds')).toEqual({ name: 'turn seconds', before: 20, after: 5 })
    })
})

type SavedRun = SavedRuns['cases'][number]['runs'][number]

type Speed = NonNullable<SavedRun['speed']>
