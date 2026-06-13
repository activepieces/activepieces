import { describe, expect, it } from 'vitest'
import { decideLoopAction } from '../../../../../../src/lib/execute/jobs/ee/chat/execute-chat-agent'

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
