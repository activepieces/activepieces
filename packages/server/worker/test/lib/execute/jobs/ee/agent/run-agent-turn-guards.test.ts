import { AgentRunSource } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { firstStepUsesFastModel } from '../../../../../../src/lib/execute/jobs/ee/agent/execute-agent-run'
import { isTransientFailureText, looksEmptyResultText } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

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

describe('firstStepUsesFastModel', () => {
    it('buys time to first token on the surfaces someone is watching', () => {
        expect(firstStepUsesFastModel({ source: AgentRunSource.CHAT })).toBe(true)
        expect(firstStepUsesFastModel({ source: AgentRunSource.AGENT })).toBe(true)
    })

    it('leaves a flow step on the model it was configured with, since nobody is waiting', () => {
        expect(firstStepUsesFastModel({ source: AgentRunSource.FLOW_STEP })).toBe(false)
    })

    it('stays off in the playground, which executes nothing', () => {
        expect(firstStepUsesFastModel({ source: AgentRunSource.CHAT, dryRun: true })).toBe(false)
    })
})
