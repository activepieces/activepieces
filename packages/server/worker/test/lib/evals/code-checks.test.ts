import { jsonSchema, tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { TurnToolCall } from './agent-turn'
import { evalCodeChecks } from './code-checks'
import { McpTools } from './tool-set'

describe('evalCodeChecks.declaredProblems', async () => {
    it('passes when nothing is declared', async () => {
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_delete_flow' })], cardsShown: ['ap_show_questions'] }) })).toEqual([])
    })

    it('noQuestionCards fails when a questions card was shown', async () => {
        const problems = await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noQuestionCards: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_show_questions' })] }) })

        expect(problems).toEqual(['showed a questions card (ap_show_questions), the case expects none'])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noQuestionCards: true }, outcome: outcomeOf({ cardsShown: ['ap_show_connection_picker'] }) })).toEqual([])
    })

    it('cardShown fails when that card never showed', async () => {
        const missing = await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { cardShown: 'ap_show_connection_picker' }, outcome: outcomeOf({ cardsShown: ['ap_show_questions'] }) })

        expect(missing).toEqual(['never showed ap_show_connection_picker (showed ap_show_questions)'])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { cardShown: 'ap_show_connection_picker' }, outcome: outcomeOf({ cardsShown: ['ap_show_connection_picker'] }) })).toEqual([])
    })

    it('noWrites fails on a workspace change or a write action, not on reads, cards or planning', async () => {
        const reads = [call({ toolName: 'ap_list_flows' }), call({ toolName: 'ap_show_questions' }), call({ toolName: 'ap_set_build_plan' }), call({ toolName: 'ap_execute_action', input: { pieceName: 'slack', actionName: 'list_channels' } })]
        const writes = [call({ toolName: 'ap_update_step' }), call({ toolName: 'ap_execute_action', input: { pieceName: 'slack', actionName: 'send_message' } })]

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: reads }) })).toEqual([])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: [...reads, ...writes] }) })).toEqual(['changed data, the case expects no writes: ap_update_step, ap_execute_action (send_message)'])
    })

    it('noDeletes fails on a delete tool or a delete action, also inside ap_lazy_tool', async () => {
        const lazyDelete = call({ toolName: 'ap_lazy_tool', input: { tool: 'ap_delete_table', input: { tableId: 't1' } } })
        const deleteAction = call({ toolName: 'ap_execute_action', input: { pieceName: 'gmail', actionName: 'gmail_delete_email' } })

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noDeletes: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step' })] }) })).toEqual([])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noDeletes: true }, outcome: outcomeOf({ calls: [lazyDelete, deleteAction] }) })).toEqual(['deleted something, the case expects no deletes: ap_delete_table, ap_execute_action (gmail_delete_email)'])
    })
})

describe('evalCodeChecks write and delete rules', async () => {
    it('counts stubbed side effects as writes, but not tests, connection checks, code runs or memory', async () => {
        const notWrites = ['ap_revalidate_connection', 'ap_test_flow', 'ap_test_step', 'ap_run_code', 'ap_remember', 'ap_set_session_title'].map((toolName) => call({ toolName }))
        const writes = ['ap_change_flow_status', 'ap_lock_and_publish', 'ap_retry_run', 'ap_create_agent'].map((toolName) => call({ toolName }))

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: notWrites }) })).toEqual([])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: writes }) })).toEqual(['changed data, the case expects no writes: ap_change_flow_status, ap_lock_and_publish, ap_retry_run, ap_create_agent'])
    })

    it('does not count a rejected or errored call as a change, a delete or a shown card', async () => {
        const errored = [call({ toolName: 'ap_update_step', errored: true }), call({ toolName: 'ap_delete_flow', errored: true }), call({ toolName: 'ap_show_questions', errored: true })]

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true, noDeletes: true, noQuestionCards: true }, outcome: outcomeOf({ calls: errored }) })).toEqual([])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { cardShown: 'ap_show_questions' }, outcome: outcomeOf({ calls: errored }) })).toEqual(['never showed ap_show_questions'])
    })

    it('does not count a write that failed, but counts a batch whose rollback failed', async () => {
        const failedWrites = [
            call({ toolName: 'ap_update_step', output: { content: [{ type: 'text', text: 'step not found' }], isError: true } }),
            call({ toolName: 'ap_execute_action', input: { pieceName: 'slack', actionName: 'send_message' }, output: { content: [{ type: 'text', text: '❌ channel_not_found' }] } }),
        ]
        const halfApplied = call({ toolName: 'ap_apply_flow_operations', errored: true, output: { content: [{ type: 'text', text: '❌ operation 2 failed' }], structuredContent: { rolledBack: false }, isError: true } })
        const rolledBack = call({ toolName: 'ap_apply_flow_operations', errored: true, output: { content: [{ type: 'text', text: '❌ operation 2 failed' }], structuredContent: { rolledBack: true }, isError: true } })

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: [...failedWrites, rolledBack] }) })).toEqual([])
        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noWrites: true }, outcome: outcomeOf({ calls: [...failedWrites, halfApplied] }) })).toEqual(['changed data, the case expects no writes: ap_apply_flow_operations'])
    })

    it('does not count a delete whose result starts with ❌, and still validates a flow it failed to delete', async () => {
        const failedDelete = call({ toolName: 'ap_delete_flow', input: { flowId: 'flow-1' }, output: { content: [{ type: 'text', text: '❌ Flow not found' }] } })
        const validated: unknown[] = []
        const mcp = mcpWith({
            ap_validate_flow: async (input) => {
                validated.push(input)
                return { content: [{ type: 'text', text: '✅ valid' }], structuredContent: { valid: true } }
            },
        })

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noDeletes: true }, outcome: outcomeOf({ calls: [failedDelete] }) })).toEqual([])
        expect(await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } }), failedDelete] }), mcp })).toEqual({ verdict: 'pass', reason: 'Every code check passed' })
        expect(validated).toEqual([{ flowId: 'flow-1' }])
    })

    it('does not call removing a label, member or tag a delete, nor an HTTP GET', async () => {
        const calls = [
            call({ toolName: 'ap_execute_action', input: { actionName: 'remove_label_from_email' } }),
            call({ toolName: 'ap_execute_action', input: { actionName: 'remove_member' } }),
            call({ toolName: 'ap_execute_action', input: { actionName: 'custom_api_call', input: { method: 'GET' } } }),
            call({ toolName: 'ap_apply_flow_operations', input: { operations: [{ type: 'update_step' }, { type: 'add_branch' }] } }),
            call({ toolName: 'ap_manage_fields', input: { operation: 'UPDATE' } }),
        ]

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noDeletes: true }, outcome: outcomeOf({ calls }) })).toEqual([])
    })

    it('catches a DELETE custom API call and delete operations inside batch and manage tools', async () => {
        const calls = [
            call({ toolName: 'ap_execute_action', input: { actionName: 'custom_api_call', input: { method: 'delete' } } }),
            call({ toolName: 'ap_apply_flow_operations', input: { operations: [{ type: 'update_step' }, { type: 'delete_step' }, { type: 'delete_branch' }] } }),
            call({ toolName: 'ap_manage_fields', input: { operation: 'DELETE' } }),
            call({ toolName: 'ap_manage_notes', input: { operation: 'DELETE' } }),
        ]

        expect(await evalCodeChecks.declaredProblems({ declaredReadOnly, checks: { noDeletes: true }, outcome: outcomeOf({ calls }) })).toEqual([
            'deleted something, the case expects no deletes: ap_execute_action (custom_api_call), ap_apply_flow_operations (delete_step), ap_apply_flow_operations (delete_branch), ap_manage_fields (DELETE), ap_manage_notes (DELETE)',
        ])
    })
})

describe('evalCodeChecks.run', async () => {
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

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp })

        expect(validated).toEqual([{ flowId: 'flow-bad' }, { flowId: 'flow-good' }])
        expect(result).toEqual({ verdict: 'fail', reason: 'flow flow-bad is not valid: step_1: channel is required' })
    })

    it('accepts a step invalid only because its declined connection is missing, and fails any other invalid step', async () => {
        const validatedConfigs: unknown[] = []
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ content: [{ type: 'text', text: '❌ 2 invalid steps' }], structuredContent: { valid: false, issues: [
                { category: 'step_validity', severity: 'error', stepName: 'step_1', message: '"Create contact" is invalid (use ap_update_step to fix).' },
                { category: 'step_validity', severity: 'error', stepName: 'step_2', message: '"Send email" is invalid (use ap_update_step to fix).' },
                { category: 'empty_branch', severity: 'info', stepName: 'step_3', message: 'fallback branch is empty' },
            ] } }),
            ap_read_step_settings: async (input) => ({ content: [{ type: 'text', text: 'settings' }], structuredContent: input['stepName'] === 'step_1'
                ? { type: 'PIECE', settings: { pieceName: '@activepieces/piece-hubspot', actionName: 'create_contact', input: { email: '{{trigger.email}}' } } }
                : { type: 'PIECE', settings: { pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { to: 'ops@example.test' } } } }),
            ap_get_piece_props: async (input) => ({ structuredContent: { props: input['pieceName'] === '@activepieces/piece-hubspot'
                ? [{ name: 'email', type: 'SHORT_TEXT', required: true }, { name: 'owner', type: 'DROPDOWN', required: true }]
                : [{ name: 'to', type: 'SHORT_TEXT', required: true }] } }),
            ap_validate_step_config: async (input) => {
                validatedConfigs.push(input)
                return { content: [{ type: 'text', text: '✅ Valid configuration' }], structuredContent: { valid: true, errors: [] } }
            },
        })
        const calls = [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })]

        const declinedHubspot = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp, declinedPieces: ['@activepieces/piece-hubspot'] })

        expect(declinedHubspot).toEqual({ verdict: 'fail', reason: 'flow flow-1 is not valid: step_2: "Send email" is invalid (use ap_update_step to fix).' })
        expect(validatedConfigs).toEqual([{ stepType: 'PIECE_ACTION', pieceName: '@activepieces/piece-hubspot', actionName: 'create_contact', input: { email: '{{trigger.email}}' }, auth: 'eval-declined-connection' }])

        const declinedBoth = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp, declinedPieces: ['@activepieces/piece-hubspot', '@activepieces/piece-gmail'] })

        expect(declinedBoth.verdict).toBe('pass')
    })

    it('fails a declined-connection step that is still invalid with a stand-in connection', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ structuredContent: { valid: false, issues: [{ category: 'step_validity', severity: 'error', stepName: 'step_1', message: '"Fetch payments" is invalid' }] } }),
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE', settings: { pieceName: 'stripe', actionName: 'list_payments', input: {} } } }),
            ap_get_piece_props: async () => ({ structuredContent: { props: [{ name: 'limit', type: 'NUMBER', required: false }] } }),
            ap_validate_step_config: async () => ({ structuredContent: { valid: false, errors: ['limit: Required'] } }),
        })

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp, declinedPieces: ['@activepieces/piece-stripe'] })

        expect(result).toEqual({ verdict: 'fail', reason: 'flow flow-1 is not valid: step_1: "Fetch payments" is invalid' })
    })

    it('fails a step whose connection was not declined, without looking further', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ structuredContent: { valid: false, issues: [{ category: 'step_validity', severity: 'error', stepName: 'step_1', message: '"Create contact" is invalid' }] } }),
        })

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp })

        expect(result.verdict).toBe('fail')
    })

    it('accepts a flow whose only invalid part is the unconnected trigger of a declined piece', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ content: [{ type: 'text', text: '❌ invalid trigger' }], structuredContent: { valid: false, issues: [], validSteps: 0, invalidSteps: 1 } }),
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE_TRIGGER', settings: { pieceName: '@activepieces/piece-hubspot', triggerName: 'new_contact', input: {} } } }),
            ap_get_piece_props: async () => ({ structuredContent: { props: [] } }),
            ap_validate_step_config: async () => ({ structuredContent: { valid: true, errors: [] } }),
        })
        const calls = [call({ toolName: 'ap_update_trigger', input: { flowId: 'flow-1' } })]

        const declined = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp, declinedPieces: ['@activepieces/piece-hubspot'] })
        const notDeclined = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp })

        expect(declined.verdict).toBe('pass')
        expect(notDeclined).toEqual({ verdict: 'fail', reason: 'flow flow-1 is not valid: ap_validate_flow reported it invalid' })
    })

    it('fails a flow with an unconnected declined trigger when another step is invalid too', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ content: [{ type: 'text', text: '❌ 2 invalid steps' }], structuredContent: { valid: false, issues: [], validSteps: 0, invalidSteps: 2 } }),
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE_TRIGGER', settings: { pieceName: '@activepieces/piece-hubspot', triggerName: 'new_contact', input: {} } } }),
            ap_get_piece_props: async () => ({ structuredContent: { props: [] } }),
            ap_validate_step_config: async () => ({ structuredContent: { valid: true, errors: [] } }),
        })

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_trigger', input: { flowId: 'flow-1' } })] }), mcp, declinedPieces: ['@activepieces/piece-hubspot'] })

        expect(result).toEqual({ verdict: 'fail', reason: 'flow flow-1 is not valid: ap_validate_flow reported it invalid' })
    })

    it('fails a flow reported valid whose trigger is counted invalid with no issue, unless a declined connection excuses it', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ content: [{ type: 'text', text: '✅ valid' }], structuredContent: { valid: true, issues: [{ category: 'template_reference', severity: 'warning', stepName: 'step_1', message: 'unused output' }], validSteps: 1, invalidSteps: 1 } }),
            ap_read_step_settings: async () => ({ structuredContent: { type: 'PIECE_TRIGGER', settings: { pieceName: '@activepieces/piece-hubspot', triggerName: 'new_contact', input: {} } } }),
            ap_get_piece_props: async () => ({ structuredContent: { props: [] } }),
            ap_validate_step_config: async () => ({ structuredContent: { valid: true, errors: [] } }),
        })
        const calls = [call({ toolName: 'ap_update_trigger', input: { flowId: 'flow-1' } })]

        const notDeclined = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp })
        const declined = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp, declinedPieces: ['@activepieces/piece-hubspot'] })

        expect(notDeclined).toEqual({ verdict: 'fail', reason: 'flow flow-1 is not valid: trigger: the trigger is invalid' })
        expect(declined.verdict).toBe('pass')
    })

    it('passes a valid flow whose invalid steps are all reported as step issues', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async () => ({ structuredContent: { valid: true, issues: [{ category: 'step_validity', severity: 'warning', stepName: 'step_2', message: 'skipped' }], validSteps: 1, invalidSteps: 1 } }),
        })

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp })

        expect(result.verdict).toBe('pass')
    })

    it('skips flow validation with skipFlowValidates', async () => {
        const result = await evalCodeChecks.run({ declaredReadOnly, checks: { skipFlowValidates: true }, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp: mcpWith({}) })

        expect(result.verdict).toBe('pass')
    })

    it('fails when ap_validate_flow reports an error or no verdict, but not for a flow the turn deleted', async () => {
        const mcp = mcpWith({
            ap_validate_flow: async (input) => input['flowId'] === 'flow-gone'
                ? { content: [{ type: 'text', text: '❌ Flow not found.' }] }
                : { content: [{ type: 'text', text: 'Flow validation failed: boom' }], isError: true },
        })
        const calls = [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } }), call({ toolName: 'ap_delete_flow', input: { flowId: 'flow-gone' } })]

        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls }), mcp })

        expect(result).toEqual({ verdict: 'fail', reason: 'could not validate flow flow-1: Flow validation failed: boom' })
    })

    it('fails when a changed flow could not be validated', async () => {
        const result = await evalCodeChecks.run({ declaredReadOnly, checks: {}, outcome: outcomeOf({ calls: [call({ toolName: 'ap_update_step', input: { flowId: 'flow-1' } })] }), mcp: mcpWith({}) })

        expect(result).toEqual({ verdict: 'fail', reason: 'could not validate flow flow-1: the dev server MCP does not offer ap_validate_flow' })
    })
})

async function declaredReadOnly({ actionName }: { pieceName: string, actionName: string }): Promise<boolean> {
    return actionName === 'list_channels'
}

function call({ toolName, input = {}, output = { success: true }, errored = false }: { toolName: string, input?: unknown, output?: unknown, errored?: boolean }): TurnToolCall {
    return { toolName, input, output, errorText: errored ? 'Invalid input' : undefined, errored }
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
