import { wideEvent } from '@activepieces/server-utils'
import { AgentAbortReason, AgentAbortReasonSchema } from '@activepieces/shared'

function abortTurn({ abortController, reason }: { abortController: AbortController, reason: AgentAbortReason }): void {
    if (abortController.signal.aborted) {
        return
    }
    wideEvent.set({ agentRun: { abortReason: reason } })
    abortController.abort(new DOMException(reason, 'AbortError'))
}

function parseReason(value: unknown): AgentAbortReason {
    const parsed = AgentAbortReasonSchema.safeParse(value)
    return parsed.success ? parsed.data : AgentAbortReason.USER_CANCEL
}

export const agentAbort = { abortTurn, parseReason }
