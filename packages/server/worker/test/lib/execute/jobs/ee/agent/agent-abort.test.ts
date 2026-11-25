import { wideEvent } from '@activepieces/server-utils'
import { AgentAbortReason } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { agentAbort } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-abort'

describe('agentAbort', () => {
    it('aborts with an AbortError whose message is the reason, and logs it on the wide event', () => {
        const setSpy = vi.spyOn(wideEvent, 'set')
        const abortController = new AbortController()

        agentAbort.abortTurn({ abortController, reason: AgentAbortReason.WALL_CLOCK })

        expect(abortController.signal.reason).toBeInstanceOf(DOMException)
        expect(abortController.signal.reason.name).toBe('AbortError')
        expect(abortController.signal.reason.message).toBe(AgentAbortReason.WALL_CLOCK)
        expect(setSpy).toHaveBeenCalledWith({ agentRun: { abortReason: AgentAbortReason.WALL_CLOCK } })
    })

    it('keeps the first reason when a second abort lands', () => {
        const abortController = new AbortController()

        agentAbort.abortTurn({ abortController, reason: AgentAbortReason.PREEMPTED })
        agentAbort.abortTurn({ abortController, reason: AgentAbortReason.WALL_CLOCK })

        expect(abortController.signal.reason.message).toBe(AgentAbortReason.PREEMPTED)
    })

    it('treats a missing or unknown reason from an older API as a user cancel', () => {
        expect(agentAbort.parseReason(undefined)).toBe(AgentAbortReason.USER_CANCEL)
        expect(agentAbort.parseReason('something_else')).toBe(AgentAbortReason.USER_CANCEL)
        expect(agentAbort.parseReason(AgentAbortReason.CONVERSATION_DELETED)).toBe(AgentAbortReason.CONVERSATION_DELETED)
    })
})
