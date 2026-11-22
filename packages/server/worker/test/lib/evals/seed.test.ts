import { jsonSchema, tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { evalSeed } from './seed'
import { McpTools } from './tool-set'

describe('evalSeed.create', () => {
    it('builds the seed flows with ap_build_flow, passing the seed as its input', async () => {
        const { mcp, calls } = mcpWith({
            ap_build_flow: async (input) => result({ text: `✅ Flow "${String(input['flowName'])}" created (id: flow-1)`, structured: { flowId: 'flow-1' } }),
        })
        const flow = { flowName: 'New lead alert', trigger: { pieceName: '@activepieces/piece-webhook', triggerName: 'catch_webhook' }, steps: [] }

        const seeded = await evalSeed.create({ mcp, seed: { flows: [flow], tables: [] } })

        expect(calls).toEqual([{ toolName: 'ap_build_flow', input: flow }])
        expect(seeded).toEqual({ flows: [{ name: 'New lead alert', id: 'flow-1' }], tables: [] })
    })

    it('creates each seed table, then inserts its records as text in batches of 50', async () => {
        const { mcp, calls } = mcpWith({
            ap_create_table: async () => result({ text: '✅ Table "Leads" created (id: tab-1, externalId: ext-1)', structured: { id: 'tab-1', externalId: 'ext-1' } }),
            ap_insert_records: async () => result({ text: '✅ Inserted records.' }),
        })
        const records = Array.from({ length: 51 }, (_, index) => ({ Name: `Lead ${index}`, Score: index }))
        const fields = [{ name: 'Name', type: 'TEXT' }, { name: 'Score', type: 'NUMBER' }]

        const seeded = await evalSeed.create({ mcp, seed: { flows: [], tables: [{ name: 'Leads', fields, records }] } })

        expect(calls[0]).toEqual({ toolName: 'ap_create_table', input: { name: 'Leads', fields } })
        expect(calls.slice(1).map((call) => call.toolName)).toEqual(['ap_insert_records', 'ap_insert_records'])
        expect(calls[1].input).toEqual(expect.objectContaining({ tableId: 'tab-1', records: expect.arrayContaining([{ Name: 'Lead 0', Score: '0' }]) }))
        expect(seeded.tables).toEqual([{ name: 'Leads', id: 'tab-1', records: 51 }])
    })

    it('seeds tables first, keeps empty values empty, and builds flows sharing a folder one at a time', async () => {
        const order: string[] = []
        const running = { now: 0, most: 0 }
        const { mcp, calls } = mcpWith({
            ap_create_table: async () => {
                order.push('table')
                return result({ text: '✅ Table created', structured: { id: 'tab-1' } })
            },
            ap_insert_records: async () => result({ text: '✅ Inserted records.' }),
            ap_build_flow: async (input) => {
                order.push(String(input['flowName']))
                running.now += 1
                running.most = Math.max(running.most, running.now)
                await new Promise((resolve) => setTimeout(resolve, 5))
                running.now -= 1
                return result({ text: '✅ Flow created', structured: { flowId: `id-${String(input['flowName'])}` } })
            },
        })

        const seeded = await evalSeed.create({ mcp, seed: { flows: [{ flowName: 'A', folderName: 'Sales' }, { flowName: 'B', folderName: 'Sales' }], tables: [{ name: 'Leads', records: [{ Name: 'Ann', Note: null }] }] } })

        expect(order).toEqual(['table', 'A', 'B'])
        expect(running.most).toBe(1)
        expect(calls.find((call) => call.toolName === 'ap_insert_records')?.input).toEqual({ tableId: 'tab-1', records: [{ Name: 'Ann', Note: '' }] })
        expect(seeded.flows).toEqual([{ name: 'A', id: 'id-A' }, { name: 'B', id: 'id-B' }])
    })

    it('fails with the tool\'s own message when a seed tool reports an error', async () => {
        const { mcp } = mcpWith({
            ap_build_flow: async () => result({ text: '❌ Piece "@activepieces/piece-nope" not found' }),
        })

        await expect(evalSeed.create({ mcp, seed: { flows: [{ flowName: 'Broken' }], tables: [] } })).rejects.toThrow('could not seed flow "Broken": ❌ Piece "@activepieces/piece-nope" not found')
    })

    it('fails when the dev server does not offer the seed tool', async () => {
        const { mcp } = mcpWith({})

        await expect(evalSeed.create({ mcp, seed: { flows: [], tables: [{ name: 'Leads' }] } })).rejects.toThrow('does not offer ap_create_table')
    })
})

function mcpWith(handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>>): { mcp: McpTools, calls: { toolName: string, input: Record<string, unknown> }[] } {
    const calls: { toolName: string, input: Record<string, unknown> }[] = []
    const toolSet: ToolSet = Object.fromEntries(Object.entries(handlers).map(([toolName, handler]) => [toolName, tool({
        inputSchema: jsonSchema<Record<string, unknown>>({ type: 'object' }),
        execute: async (input) => {
            calls.push({ toolName, input })
            return handler(input)
        },
    })]))
    return { mcp: { toolSet, close: async () => {}, projectId: 'proj-ws', projectName: 'eval-ws', conversationId: 'evalconv' }, calls }
}

function result({ text, structured }: { text: string, structured?: Record<string, unknown> }): unknown {
    return { content: [{ type: 'text', text }], ...(structured === undefined ? {} : { structuredContent: structured }) }
}
