import { jsonSchema, tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { declinedSteps } from './declined-steps'
import { McpTools } from './tool-set'

describe('declinedSteps.configProblems', () => {
    const props = [
        { name: 'channel', type: 'DROPDOWN', required: true },
        { name: 'text', type: 'LONG_TEXT', required: true },
        { name: 'count', type: 'NUMBER', required: false },
        { name: 'notify', type: 'CHECKBOX', required: false },
        { name: 'mode', type: 'STATIC_DROPDOWN', required: true, options: [{ value: 'fast' }, { value: 'slow' }] },
    ]

    it('excuses only a missing required dropdown or dynamic prop', () => {
        expect(declinedSteps.configProblems({ props, input: { text: 'hi', mode: 'fast' } })).toEqual([])
        expect(declinedSteps.configProblems({ props, input: { mode: 'fast' } })).toEqual(['missing required text'])
    })

    it('fails unknown property names and wrong value types, but accepts templates', () => {
        expect(declinedSteps.configProblems({ props, input: { text: 'hi', mode: 'medium', count: 'lots', notify: 'yes', chanel: '#sales' } })).toEqual([
            'unknown property chanel',
            'count is not a valid NUMBER',
            'notify is not a valid CHECKBOX',
            'mode is not a valid STATIC_DROPDOWN',
        ])
        expect(declinedSteps.configProblems({ props, input: { text: '{{trigger.body.text}}', mode: 'slow', count: '{{step_1.count}}', notify: true } })).toEqual([])
    })
})

describe('declinedSteps.onlyMissesConnection', () => {
    it('excuses an unconnected trigger of a declined piece', async () => {
        const validated: unknown[] = []
        const mcp = mcpWith({
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE_TRIGGER', settings: { pieceName: '@activepieces/piece-hubspot', triggerName: 'new_contact', input: {} } } }),
            ap_get_piece_props: async () => ({ structuredContent: { props: [] } }),
            ap_validate_step_config: async (input) => {
                validated.push(input)
                return { structuredContent: { valid: true, errors: [] } }
            },
        })

        expect(await declinedSteps.onlyMissesConnection({ mcp, flowId: 'f1', stepName: 'trigger', declined: new Set(['@activepieces/piece-hubspot']) })).toBe(true)
        expect(validated).toEqual([{ stepType: 'PIECE_TRIGGER', pieceName: '@activepieces/piece-hubspot', triggerName: 'new_contact', input: {}, auth: 'eval-declined-connection' }])
        expect(await declinedSteps.onlyMissesConnection({ mcp, flowId: 'f1', stepName: 'trigger', declined: new Set(['@activepieces/piece-slack']) })).toBe(false)
    })

    it('does not excuse a step whose props it cannot read', async () => {
        const mcp = mcpWith({
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE', settings: { pieceName: 'hubspot', actionName: 'create_contact', input: {} } } }),
        })

        expect(await declinedSteps.onlyMissesConnection({ mcp, flowId: 'f1', stepName: 'step_1', declined: new Set(['@activepieces/piece-hubspot']) })).toBe(false)
    })
})

function mcpWith(handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>>): McpTools {
    const toolSet: ToolSet = Object.fromEntries(Object.entries(handlers).map(([toolName, handler]) => [toolName, tool({
        inputSchema: jsonSchema<Record<string, unknown>>({ type: 'object' }),
        execute: async (input) => handler(input),
    })]))
    return { toolSet, close: async () => {}, projectId: 'proj-ws', projectName: 'eval-ws', conversationId: 'evalconv' }
}
