import { describe, expect, it } from 'vitest'
import { DatasetItem, evalCase } from './eval-case'

describe('evalCase.fromDatasetItem', () => {
    it('splits history, the graded user message and the recorded tool results', () => {
        const converted = evalCase.fromDatasetItem({
            id: 'item-1',
            version_id: 'version-1',
            source_trace_id: 'trace-1',
            expected_output: { checks: ['No tool call is rejected'], problem_type: 'repeated_errors' },
            metadata: { case: 1, problem_type: 'repeated_errors', code_check: 'tool_input_rejected' },
            input: JSON.stringify([
                { role: 'user', parts: [{ type: 'text', content: 'earlier question' }] },
                { role: 'assistant', parts: [{ type: 'text', content: 'earlier answer' }] },
                { role: 'user', parts: [{ type: 'text', content: 'research my company' }] },
                { role: 'assistant', parts: [
                    { type: 'reasoning', content: 'thinking' },
                    { type: 'tool_call', id: 'a', name: 'ap_lazy_tool', arguments: { tool: 'ap_web_search', input: { searchQuery: 'x' } } },
                ] },
                { role: 'tool', parts: [{ type: 'tool_call_response', id: 'a', response: 'AI_InvalidToolInputError: Invalid input for tool ap_lazy_tool' }] },
                { role: 'assistant', parts: [{ type: 'tool_call', id: 'b', name: 'ap_lazy_tool', arguments: { tool: 'ap_web_search', input: { query: 'x' } } }] },
                { role: 'tool', parts: [{ type: 'tool_call_response', id: 'b', response: { answer: 'found it' } }] },
            ]),
        })

        expect(converted.userMessage).toBe('research my company')
        expect(converted.messages).toEqual([
            { role: 'user', content: 'earlier question' },
            { role: 'assistant', content: [{ type: 'text', text: 'earlier answer' }] },
            { role: 'user', content: 'research my company' },
        ])
        expect(converted.steps.map((step) => step.toolCalls)).toEqual([
            [{ toolName: 'ap_web_search', rejected: true }],
            [{ toolName: 'ap_web_search', rejected: false }],
        ])
        expect(converted.recordedToolCalls).toEqual([{ toolName: 'ap_web_search', input: { query: 'x' }, output: { answer: 'found it' } }])
        expect(converted.live).toBeNull()
    })

    it('keeps the live metadata and accepts a plain user message with no trace', () => {
        const item = DatasetItem.parse({
            id: 'item-2',
            version_id: 'version-2',
            expected_output: { checks: ['Builds the flow'], problem_type: 'build' },
            metadata: {
                case: 2,
                problem_type: 'build',
                mode: 'live',
                tier: 'hard',
                seed: { flows: [{ flowName: 'Old', trigger: { pieceName: 'webhook', triggerName: 'catch_webhook' }, steps: [] }] },
                answers: { questions: 'every Monday', connections: { slack: 'none' } },
                codeChecks: { noQuestionCards: true, cardShown: 'ap_show_connection_picker' },
                faults: [{ toolName: 'ap_build_flow', error: 'Validation failed', times: 2 }],
                timeoutMs: 60_000,
            },
            input: 'post new leads to #sales',
        })
        const converted = evalCase.fromDatasetItem(item)

        expect(converted.userMessage).toBe('post new leads to #sales')
        expect(converted.recordedToolCalls).toEqual([])
        expect(converted.live).toEqual({
            tier: 'hard',
            seed: { flows: [{ flowName: 'Old', trigger: { pieceName: 'webhook', triggerName: 'catch_webhook' }, steps: [] }], tables: [] },
            answers: { questions: 'every Monday', connections: { slack: 'none' } },
            codeChecks: { noQuestionCards: true, cardShown: 'ap_show_connection_picker' },
            faults: [{ toolName: 'ap_build_flow', error: 'Validation failed', times: 2 }],
            timeoutMs: 60_000,
        })
    })

    it('defaults a live case to the 15 minute build limit', () => {
        const converted = evalCase.fromDatasetItem(DatasetItem.parse({
            id: 'item-3',
            version_id: 'version-3',
            expected_output: { checks: ['Builds the flow'], problem_type: 'build' },
            metadata: { case: 3, problem_type: 'build', mode: 'live' },
            input: JSON.stringify([{ role: 'user', parts: [{ type: 'text', content: 'build it' }] }]),
        }))

        expect(converted.live?.timeoutMs).toBe(15 * 60_000)
    })
})
