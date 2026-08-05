import { describe, expect, it } from 'vitest'
import { stepResultFrom } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-step-result'
import { decideLoopAction, shouldRetryStream } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

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

describe('shouldRetryStream', () => {
    it('retries once when the stream fails before any visible output', () => {
        expect(shouldRetryStream({ producedVisibleOutput: false, streamRetries: 0 })).toBe(true)
    })

    it('does not retry after the single retry has been used', () => {
        expect(shouldRetryStream({ producedVisibleOutput: false, streamRetries: 1 })).toBe(false)
    })

    it('never retries once visible output was already streamed (avoids duplicate content)', () => {
        expect(shouldRetryStream({ producedVisibleOutput: true, streamRetries: 0 })).toBe(false)
    })
})

describe('stepResultFrom', () => {
    const text = (value: string) => ({ type: 'text' as const, text: value })
    const at = '2026-08-05T00:00:00.000Z'

    it('projects the transcript into the step blocks the run viewer reads', () => {
        const result = stepResultFrom({ prompt: 'do it', uiParts: [text('done')], timestamp: at })

        expect(result.status).toBe('COMPLETED')
        expect(result.prompt).toBe('do it')
        expect(result.steps).toEqual([{ type: 'MARKDOWN', markdown: 'done' }])
    })

    it('keeps the partial answer when the turn did not finish, and says it failed', () => {
        const result = stepResultFrom({ prompt: 'do it', uiParts: [text('half')], timestamp: at, failure: 'ran out of room' })

        expect(result.status).toBe('FAILED')
        expect(result.steps).toHaveLength(2)
    })

    it('drops empty text so a blank block never reaches the flow', () => {
        const result = stepResultFrom({ prompt: 'do it', uiParts: [text('   ')], timestamp: at })

        expect(result.steps).toEqual([])
    })

    it('caps a block so an unbounded answer cannot be written into the resume payload', () => {
        const result = stepResultFrom({ prompt: 'do it', uiParts: [text('x'.repeat(80_000))], timestamp: at })

        expect(result.steps[0]).toEqual({ type: 'MARKDOWN', markdown: 'x'.repeat(51_200) })
    })
})

describe('stepResultFrom — a failed tool call must not read as success', () => {
    const at = '2026-08-05T00:00:00.000Z'
    const failedCall = {
        type: 'tool-call' as const,
        toolCallId: 'call-1',
        toolName: 'send_email',
        input: { to: 'a@b.c' },
        status: 'error' as const,
        errorText: 'mailbox full',
    }

    it('marks the whole result failed when any tool call errored', () => {
        const result = stepResultFrom({ prompt: 'send it', uiParts: [failedCall], timestamp: at })

        expect(result.status).toBe('FAILED')
    })

    it('carries the error text so a later step can see what went wrong', () => {
        const result = stepResultFrom({ prompt: 'send it', uiParts: [failedCall], timestamp: at })

        expect(JSON.stringify(result.steps[0])).toContain('mailbox full')
    })
})
