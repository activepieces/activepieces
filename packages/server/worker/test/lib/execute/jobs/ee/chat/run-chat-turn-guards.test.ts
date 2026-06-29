import { describe, expect, it } from 'vitest'
import { isTransientFailureText, looksEmptyResultText } from '../../../../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

describe('isTransientFailureText', () => {
    it('flags retryable errors (rate limit, 5xx, timeout, dropped socket)', () => {
        for (const t of ['❌ failed: 429 Too Many Requests', '❌ 503 Service Unavailable', '❌ request timed out', '❌ ECONNRESET', '❌ rate limit exceeded']) {
            expect(isTransientFailureText(t), t).toBe(true)
        }
    })

    it('does not flag permanent errors (4xx validation/auth)', () => {
        for (const t of ['❌ Cannot run action: missing required field channel', '❌ 401 unauthorized', '❌ 400 bad request: invalid email']) {
            expect(isTransientFailureText(t), t).toBe(false)
        }
    })
})

describe('looksEmptyResultText', () => {
    it('detects the empty-read shapes the agent kept re-fetching', () => {
        for (const t of ['✅ Find Record completed. {"found":false,"result":[]}', 'Note: empty result. "find_record" returns a SINGLE match', '{"results":[]}']) {
            expect(looksEmptyResultText(t), t).toBe(true)
        }
    })

    it('does not flag a populated result', () => {
        expect(looksEmptyResultText('✅ done {"found":true,"result":[{"id":"r1"}]}')).toBe(false)
    })
})
