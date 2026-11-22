import { tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { CreatingToolCall, createdResources } from './created-resources'
import { McpTools } from './tool-set'

describe('createdResources.fromToolCalls', () => {
    it('collects flow, table and folder ids from create and build results', () => {
        const created = createdResources.fromToolCalls({ toolCalls: [
            call({ toolName: 'ap_create_folder', output: mcpResult({ text: '✅ Folder "Leads" is ready (id: fold1).', structured: { folderId: 'fold1', folderName: 'Leads' } }) }),
            call({ toolName: 'ap_create_table', output: mcpResult({ text: '✅ Table "Leads" created (id: tab1, externalId: ext1)', structured: { id: 'tab1', externalId: 'ext1' } }) }),
            call({ toolName: 'ap_build_flow', output: mcpResult({ text: '✅ Flow "Post leads" created (id: flow1) with 2 steps', structured: { flowId: 'flow1' } }) }),
            call({ toolName: 'ap_create_flow', output: mcpResult({ text: '✅ Created flow "Empty" (id: flow2).', structured: { flowId: 'flow2' } }) }),
        ] })

        expect(created).toEqual({ flowIds: ['flow1', 'flow2'], tableIds: ['tab1'], folderIds: ['fold1'] })
    })

    it('falls back to the result text when structured content is missing', () => {
        const created = createdResources.fromToolCalls({ toolCalls: [
            call({ toolName: 'ap_duplicate_flow', output: mcpResult({ text: '✅ Flow duplicated successfully.\n  Original: "A" (id: flowA)\n  Copy: "A copy" (id: flowB)' }) }),
            call({ toolName: 'ap_build_flow', output: mcpResult({ text: '⚠️ Flow "B" created (id: flowC) in folder "Leads" with 3 steps' }) }),
        ] })

        expect(created.flowIds).toEqual(['flowB', 'flowC'])
    })

    it('ignores errored calls, error results, reads and edits of existing flows', () => {
        const created = createdResources.fromToolCalls({ toolCalls: [
            call({ toolName: 'ap_build_flow', output: undefined, errored: true }),
            call({ toolName: 'ap_create_table', output: { ...mcpResult({ text: '❌ Field "x" is STATIC_DROPDOWN', structured: { id: 'tabX' } }), isError: true } }),
            call({ toolName: 'ap_list_flows', output: mcpResult({ text: 'Listed', structured: { flows: [{ id: 'old' }] } }) }),
            call({ toolName: 'ap_update_step', input: { flowId: 'old' }, output: mcpResult({ text: 'Updated', structured: { flowId: 'old' } }) }),
        ] })

        expect(created).toEqual({ flowIds: [], tableIds: [], folderIds: [] })
    })

    it('dedupes an id seen twice in a turn', () => {
        const build = call({ toolName: 'ap_create_flow', output: mcpResult({ text: 'Created flow "A" (id: flow1)', structured: { flowId: 'flow1' } }) })
        expect(createdResources.fromToolCalls({ toolCalls: [build, build] }).flowIds).toEqual(['flow1'])
    })
})

describe('createdResources.remove', () => {
    it('deletes flows and tables, and reports what it could not delete', async () => {
        const deleted: string[] = []
        const problems = await createdResources.remove({
            mcp: mcpWith({ toolSet: {
                ap_delete_flow: tool({
                    inputSchema: z.object({ flowId: z.string() }),
                    execute: async ({ flowId }) => {
                        deleted.push(flowId)
                        return flowId === 'gone' ? { content: [{ type: 'text', text: '❌ Flow not found' }], isError: true } : { content: [{ type: 'text', text: 'deleted' }] }
                    },
                }),
            } }),
            created: { flowIds: ['flow1', 'gone'], tableIds: ['tab1'], folderIds: [] },
        })

        expect(deleted).toEqual(['flow1', 'gone'])
        expect(problems).toEqual(['could not delete flow gone: ❌ Flow not found', 'could not delete table tab1: the dev server MCP does not offer ap_delete_table'])
    })
})

function call({ toolName, output, input = {}, errored = false }: { toolName: string, output: unknown, input?: unknown, errored?: boolean }): CreatingToolCall {
    return { toolName, input, output, errored }
}

function mcpResult({ text, structured }: { text: string, structured?: Record<string, unknown> }): Record<string, unknown> {
    return { content: [{ type: 'text', text }], ...(structured === undefined ? {} : { structuredContent: structured }) }
}

function mcpWith({ toolSet }: { toolSet: ToolSet }): McpTools {
    return { toolSet, close: async () => {}, projectId: 'proj-1', projectName: 'Eval project', conversationId: 'eval-conversation' }
}
