import { tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { replay } from './replay'
import { evalToolSet } from './tool-set'

describe('evalToolSet.build', () => {
    it('offers ap_set_build_plan to the agent', () => {
        const tools = buildWith({ mcpTools: {} })
        expect(tools['ap_set_build_plan']?.execute).toBeDefined()
        expect(tools).not.toHaveProperty('onFlowToolResult')
    })

    it('runs the build card hook on flow tool results like production', async () => {
        const tools = buildWith({
            mcpTools: {
                ap_build_flow: tool({
                    inputSchema: z.object({}),
                    execute: async () => ({ content: [{ type: 'text', text: 'Built.' }] }),
                }),
            },
        })
        const result = await tools['ap_build_flow']?.execute?.({}, { toolCallId: 'call-1', messages: [], context: undefined })
        expect(JSON.stringify(result)).toContain('No build card is showing')
    })
})

function buildWith({ mcpTools }: { mcpTools: ToolSet }): ToolSet {
    return evalToolSet.build({
        mcp: { toolSet: mcpTools, close: async () => {}, projectName: 'Eval project', conversationId: 'eval-conversation' },
        caseReplay: replay.create({ recordedToolCalls: [] }),
        auth: {},
        mode: 'live',
        user: null,
    })
}
