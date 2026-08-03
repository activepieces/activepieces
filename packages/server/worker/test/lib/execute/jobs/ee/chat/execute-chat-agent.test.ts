import { describe, expect, it } from 'vitest'
import { decideLoopAction, decideStreamFailureAction } from '../../../../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

describe('decideLoopAction', () => {
    it('finishes when a normal step produced visible output', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: true, continuations: 0, emptyContinuations: 0 })).toBe('finish')
        expect(decideLoopAction({ finishReason: 'tool-calls', producedVisibleOutput: true, continuations: 0, emptyContinuations: 0 })).toBe('finish')
    })

    it('nudges (continue_empty) when a step produced no visible output, within the cap', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 0 })).toBe('continue_empty')
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 1 })).toBe('continue_empty')
    })

    it('stops nudging empty steps once the empty cap is reached', () => {
        expect(decideLoopAction({ finishReason: 'stop', producedVisibleOutput: false, continuations: 0, emptyContinuations: 2 })).toBe('finish')
    })

    it('auto-continues on truncation until the truncation cap', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 0, emptyContinuations: 0 })).toBe('continue_truncation')
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: true, continuations: 2, emptyContinuations: 0 })).toBe('continue_truncation')
    })

    it('finishes once the truncation cap is reached', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 3, emptyContinuations: 0 })).toBe('finish')
    })

    it('treats truncation as higher priority than emptiness', () => {
        expect(decideLoopAction({ finishReason: 'length', producedVisibleOutput: false, continuations: 0, emptyContinuations: 2 })).toBe('continue_truncation')
    })
})

describe('decideStreamFailureAction', () => {
    it('never retries or fails over once visible output was already streamed (avoids duplicate content)', () => {
        expect(decideStreamFailureAction({ errorMessage: '429 rate limit', producedVisibleOutput: true, sameSlotRetries: 0, hasNextSlot: true })).toBe('stop')
    })

    it('stops immediately on credit exhaustion — a billing state, never an outage', () => {
        expect(decideStreamFailureAction({ errorMessage: 'You are out of credits', producedVisibleOutput: false, sameSlotRetries: 0, hasNextSlot: true })).toBe('stop')
        expect(decideStreamFailureAction({ errorMessage: 'HTTP 402 payment required', producedVisibleOutput: false, sameSlotRetries: 0, hasNextSlot: true })).toBe('stop')
    })

    it('retries the same slot once on a transient error, then fails over', () => {
        expect(decideStreamFailureAction({ errorMessage: '429 rate limit exceeded', producedVisibleOutput: false, sameSlotRetries: 0, hasNextSlot: true })).toBe('retry_slot')
        expect(decideStreamFailureAction({ errorMessage: '429 rate limit exceeded', producedVisibleOutput: false, sameSlotRetries: 1, hasNextSlot: true })).toBe('advance_slot')
    })

    it('fails over immediately on a non-transient error (e.g. revoked key) when a backup exists', () => {
        expect(decideStreamFailureAction({ errorMessage: '401 invalid api key', producedVisibleOutput: false, sameSlotRetries: 0, hasNextSlot: true })).toBe('advance_slot')
    })

    it('degrades to the pre-routing semantics on a single-slot chain: one retry, then stop', () => {
        expect(decideStreamFailureAction({ errorMessage: '401 invalid api key', producedVisibleOutput: false, sameSlotRetries: 0, hasNextSlot: false })).toBe('retry_slot')
        expect(decideStreamFailureAction({ errorMessage: '401 invalid api key', producedVisibleOutput: false, sameSlotRetries: 1, hasNextSlot: false })).toBe('stop')
        expect(decideStreamFailureAction({ errorMessage: '429 rate limit', producedVisibleOutput: false, sameSlotRetries: 1, hasNextSlot: false })).toBe('stop')
    })
})
