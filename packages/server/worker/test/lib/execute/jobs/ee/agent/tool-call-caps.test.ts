import { tool, ToolExecutionOptions } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { agentWorkerTools } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'

describe('capToolCallsPerTurn', () => {
    it('refuses calls past the limit, even when they arrive in parallel, and marks them so they are not billed', async () => {
        const search = vi.fn(async () => ({ success: true }))
        const tools = agentWorkerTools.capToolCallsPerTurn({ limits: { ap_web_search: 2 }, tools: { ap_web_search: echoTool(search) } })

        const results = await Promise.all([1, 2, 3].map(() => tools.ap_web_search.execute?.({}, EXECUTION_OPTIONS)))

        expect(search).toHaveBeenCalledTimes(2)
        expect(results.slice(0, 2)).toEqual([{ success: true }, { success: true }])
        expect(results[2]).toMatchObject({ capped: true, content: [{ type: 'text', text: expect.stringContaining('2 times') }] })
    })

    it('leaves tools without a limit alone', async () => {
        const fetchUrl = vi.fn(async () => ({ success: true }))
        const tools = agentWorkerTools.capToolCallsPerTurn({ limits: { ap_web_search: 1 }, tools: { ap_fetch_url: echoTool(fetchUrl) } })

        await tools.ap_fetch_url.execute?.({}, EXECUTION_OPTIONS)
        await tools.ap_fetch_url.execute?.({}, EXECUTION_OPTIONS)

        expect(fetchUrl).toHaveBeenCalledTimes(2)
    })
})

function echoTool(execute: () => Promise<unknown>): ReturnType<typeof tool> {
    return tool({ description: 'test', inputSchema: z.object({}), execute })
}

const EXECUTION_OPTIONS: ToolExecutionOptions = { toolCallId: 'call-1', messages: [] }
