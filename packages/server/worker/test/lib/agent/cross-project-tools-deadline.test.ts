import { ToolExecutionOptions } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'

describe('chat cross-project tool deadlines', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it.each([
        ['ap_run_code', { code: 'export const code = async () => 1' }],
        ['ap_explore_data', { pieceName: '@activepieces/piece-google-sheets', actionName: 'get_rows' }],
        ['ap_list_across_projects', { resource: 'flows' }],
    ])('leaves %s to the server action budget, with no 5 minute worker cap', async (toolName, input) => {
        expect(await stateAfter({ toolName, input, advanceMs: 10 * 60 * 1_000 })).toBe('pending')
    })
})

async function stateAfter({ toolName, input, advanceMs }: { toolName: string, input: Record<string, unknown>, advanceMs: number }): Promise<'pending' | 'failed'> {
    vi.useFakeTimers()
    const tools = agentWorkerTools.createCrossProjectTools({
        executeTool: () => new Promise(() => undefined),
        eventEmitter: agentWorkerTools.createEventEmitter({ sendEvent: async () => undefined, userId: 'user-1', conversationId: 'conversation-1' }),
        waitForApproval: async () => ({ outcome: 'approved' }),
        taintState: { tainted: false },
    })
    let state: 'pending' | 'failed' = 'pending'
    Promise.resolve(tools[toolName].execute?.(input, OPTIONS)).catch(() => {
        state = 'failed'
    })
    await vi.advanceTimersByTimeAsync(advanceMs)
    vi.useRealTimers()
    return state
}

const OPTIONS: ToolExecutionOptions<undefined> = { toolCallId: 'call-1', messages: [] }
