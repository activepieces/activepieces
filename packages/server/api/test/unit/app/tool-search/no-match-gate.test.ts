import { describe, expect, it } from 'vitest'
import { applyNoMatchGate } from '../../../../src/app/tool-search/no-match-gate'

// The τ no-match gate is calibrated on the TOP-1 cosine (DECISION_REPORT §5): if the single best
// candidate clears τ the query is answerable and the full ranked top-k is returned; otherwise the
// engine abstains with an empty list rather than serving confident junk (the Composio-beating edge).
const ranked = (...cosines: number[]): { cosine: number }[] => cosines.map((cosine) => ({ cosine }))

describe('applyNoMatchGate', () => {
    it('returns the full ranked list when the top cosine clears τ', () => {
        const results = ranked(0.71, 0.62, 0.55)
        expect(applyNoMatchGate(results, 0.53)).toEqual(results)
    })

    it('abstains (empty) when the best match falls below τ', () => {
        expect(applyNoMatchGate(ranked(0.41, 0.30, 0.12), 0.53)).toEqual([])
    })

    it('gates on the top-1 score only — keeps a below-τ tail once the best clears τ', () => {
        // 0.70 clears τ so the query is answerable; the 0.40/0.20 tail is NOT individually filtered.
        const results = ranked(0.70, 0.40, 0.20)
        expect(applyNoMatchGate(results, 0.53)).toEqual(results)
    })

    it('treats a top cosine exactly equal to τ as a match (>= τ)', () => {
        const results = ranked(0.53)
        expect(applyNoMatchGate(results, 0.53)).toEqual(results)
    })

    it('returns empty for an empty candidate list', () => {
        expect(applyNoMatchGate([], 0.53)).toEqual([])
    })

    it('abstains when the top cosine is NaN (degenerate/zero query vector)', () => {
        expect(applyNoMatchGate(ranked(Number.NaN), 0.53)).toEqual([])
    })
})
