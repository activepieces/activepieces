import { jsonSchema, tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { TurnToolCall } from './agent-turn'
import { evalCodeChecks } from './code-checks'
import { McpTools } from './tool-set'

describe('evalCodeChecks.declaredProblems', () => {
    it('passes when nothing is declared', () => {
        expect(evalCodeChecks.declaredProblems({ checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_delete_flow' })], cardsShown: ['ap_show_questions'] }) })).toEqual([])
    })

    it('noQuestionCards fails when a questions card was shown', () => {
        const problems = evalCodeChecks.declaredProblems({ checks: { noQuestionCards: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_show_questions' })] }) })

        expect(problems).toEqual(['showed a questions card (ap_show_questions), the case expects none'])
        expect(evalCodeChecks.declaredProblems({ checks: { noQuestionCards: true }, outcome: outcomeOf({ cardsShown: ['ap_show_connection_picker'] }) })).toEqual([])
    })

    it('cardShown fails when that card never showed', () => {
        const missing = evalCodeChecks.declaredProblems({ checks: { cardShown: 'ap_show_connection_picker' }, outcome: outcomeOf({ cardsShown: ['ap_show_questions'] }) })

        expect(missing).toEqual(['never showed ap_show_connection_picker (showed ap_show_questions)'])
        expect(evalCodeChecks.declaredProblems({ checks: { cardShown: 'ap_show_connection_picker' }, outcome: outcomeOf({ cardsShown: ['ap_show_connection_picker'] }) })).toEqual([])
    })

    it('noWrites fails on a workspace change or a write action, not on reads, cards or planning', () => {
        const reads = [call({ toolName: 'ap_list_flows' }), call({ toolName: 'ap_show_questions' }), call({ toolName: 'ap_set_build_plan' }), call({ toolName: 'ap_execute_action', input: { pieceName: 'slack', actionName: 'list_channels' } })]
        const writes = [call({ toolName: 'ap_update_step' }), call({ toolName: 'ap_execute_action', input: { pieceName: 'slack', actionName: 'send_message' } })]

        expect(evalCodeChecks.declaredProblems({ checks: { noWrites: true }, outcome: outcomeOf({ calls: reads }) })).toEqual([])
        expect(evalCodeChecks.declaredProblems({ checks: { noWrites: true }, outcome: outcomeOf({ calls: [...reads, ...writes] }) })).toEqual(['changed data, the case expects no writes: ap_update_step, ap_execute_action (send_message)'])
    })

    it('noDeletes fails on a delete tool or a delete action, also inside ap_lazy_tool', () => {
        const lazyDelete = call({ toolName: 'ap_lazy_tool', input: { tool: 'ap_delete_table', input: { tableId: 't1' } } })
        const deleteAction = call({ toolName: 'ap_execute_action', input: { pieceName: 'gmail', actionName: 'gmail_delete_email' } })

        expect(evalCodeChecks.declaredProblems({ checks: { noDeletes: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step' })] }) })).toEqual([])
        expect(evalCodeChecks.declaredProblems({ checks: { noDeletes: true }, outcome: outcomeOf({ calls: [lazyDelete, deleteAction] }) })).toEqual(['deleted something, the case expects no deletes: ap_delete_table, ap_execute_action (gmail_delete_email)'])
    })
})

describe('evalCodeChecks.run', () => {
    it('validates every flow the turn changed and fails on an invalid one', async () => {
        const validated: unknown[] = []
        const mcp = mcpWith({
            ap_validate_flow: async (input) => {
                validated.push(input)
                return input['flowId'] === 'flow-bad'
                    ? { content: [{ type: 'text', text: '❌ 1 invalid step' }], structuredContent: { valid: false, issues: [{ stepName: 'step_1', message: 'channel is required' }] } }
                    : { content: [{ type: 'text', text: '✅ valid' }], structuredContent: { valid: true, issues: [] } }
            },
        })
        const calls = [call({ toolName: 'ap_update_step', input: { flowId: 'flow-bad' } }), call({ toolName: 'ap_build_flow', output: { structuredContent: { flowId: 'flow-good' } } }), call({ toolName: 'ap_flow_structure', input: { flowId: 'flow-read' } })]

        const result = await evalCodeChecks.run({ checks: {}, outcome: outcomeOf({ calls }), mcp })

        expect(validated).toEqual([{ flowId: 'flow-bad' }, { flowId: 'flow-good' }])
        expect(result).toEqual({ verdict: 'fail', reason: 'flow flow-bad is not valid: step_1: channel is required' })
    })

    it('skips flow validation with skipFlowValidates', async () => {
        const result = await evalCodeChecks.run({ checks: { skipFlowValidates: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp: mcpWith({}) })

        expect(result.verdict).toBe('pass')
    })

    it('fails when a changed flow could not be validated', async () => {
        const result = await evalCodeChecks.run({ checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp: mcpWith({}) })

        expect(result).toEqual({ verdict: 'fail', reason: 'could not validate flow flow-1: the dev server MCP does not offer ap_validate_flow' })
    })
})

function call({ toolName, input = {}, output = { success: true } }: { toolName: string, input?: unknown, output?: unknown }): TurnToolCall {
    return { toolName, input, output, errorText: undefined, errored: false }
}

function outcomeOf({ calls = [], cardsShown = [] }: { calls?: TurnToolCall[], cardsShown?: string[] }): { toolCalls: TurnToolCall[], cardsShown: string[] } {
    return { toolCalls: calls, cardsShown }
}

function mcpWith(handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>>): McpTools {
    const toolSet: ToolSet = Object.fromEntries(Object.entries(handlers).map(([toolName, handler]) => [toolName, tool({
        inputSchema: jsonSchema<Record<string, unknown>>({ type: 'object' }),
        execute: async (input) => handler(input),
    })]))
    return { toolSet, close: async () => {}, projectId: 'proj-ws', projectName: 'eval-ws', conversationId: 'evalconv' }
}
