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
    ])('lets %s run until the action budget ends, past the 5 minute tool cap', async (toolName, input) => {
        expect(await stateAfter({ toolName, input, advanceMs: 10 * 60 * 1_000 })).toBe('pending')
        expect(await stateAfter({ toolName, input, advanceMs: 12 * 60 * 1_000 + 1 })).toBe('timed out')
    })

    it('still stops any other tool at 5 minutes', async () => {
        expect(await stateAfter({ toolName: 'ap_list_across_projects', input: { resource: 'flows' }, advanceMs: 5 * 60 * 1_000 + 1 })).toBe('timed out')
    })
})

async function stateAfter({ toolName, input, advanceMs }: { toolName: string, input: Record<string, unknown>, advanceMs: number }): Promise<'pending' | 'timed out'> {
    vi.useFakeTimers()
    const tools = agentWorkerTools.createCrossProjectTools({
        executeTool: () => new Promise(() => undefined),
        eventEmitter: agentWorkerTools.createEventEmitter({ sendEvent: async () => undefined, userId: 'user-1', conversationId: 'conversation-1' }),
        waitForApproval: async () => ({ outcome: 'approved' }),
        taintState: { tainted: false },
    })
    let state: 'pending' | 'timed out' = 'pending'
    Promise.resolve(tools[toolName].execute?.(input, OPTIONS)).catch(() => {
        state = 'timed out'
    })
    await vi.advanceTimersByTimeAsync(advanceMs)
    vi.useRealTimers()
    return state
}

const OPTIONS: ToolExecutionOptions<undefined> = { toolCallId: 'call-1', messages: [] }
