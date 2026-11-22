import { tool, ToolSet } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { replay } from './replay'
import { scriptedUser, ScriptedUser } from './scripted-user'
import { evalToolSet } from './tool-set'

describe('evalToolSet.build', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

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

    it('stores the connection the scripted user picks on the dev server', async () => {
        vi.stubEnv('AP_API_KEY', 'eval-key')
        const requests: unknown[] = []
        vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
            requests.push(JSON.parse(init.body))
            return new Response(JSON.stringify({ result: { success: true } }), { status: 200 })
        })
        const user = scriptedUser.create({
            answers: { questions: null, connections: {} },
            listConnections: async () => [{ externalId: 'gmail-conn', displayName: 'Work Gmail', status: 'ACTIVE' }],
        })
        const tools = buildWith({ mcpTools: {}, user })
        await tools['ap_show_connection_picker']?.execute?.({ piece: 'gmail', displayName: 'Gmail' }, { toolCallId: 'call-1', messages: [], context: undefined })

        expect(requests).toContainEqual({
            toolName: '__store_selected_connection',
            toolInput: { pieceName: '@activepieces/piece-gmail', connectionExternalId: 'gmail-conn', label: 'Work Gmail', projectId: expect.any(String) },
            conversationId: 'eval-conversation',
        })
    })
})

function buildWith({ mcpTools, user = null }: { mcpTools: ToolSet, user?: ScriptedUser | null }): ToolSet {
    return evalToolSet.build({
        mcp: { toolSet: mcpTools, close: async () => {}, projectName: 'Eval project', conversationId: 'eval-conversation' },
        caseReplay: replay.create({ recordedToolCalls: [] }),
        auth: {},
        mode: 'live',
        user,
    })
}
