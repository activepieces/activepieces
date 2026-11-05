import { describe, expect, it } from 'vitest'
import { evalCase } from './eval-case'

describe('evalCase.fromDatasetItem', () => {
    it('splits history, the graded user message and the recorded tool results', () => {
        const converted = evalCase.fromDatasetItem({
            id: 'item-1',
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
        expect(converted.history).toEqual([
            { role: 'user', content: 'earlier question' },
            { role: 'assistant', content: [{ type: 'text', text: 'earlier answer' }] },
        ])
        expect(converted.recordedToolCalls).toEqual([{ toolName: 'ap_web_search', input: { query: 'x' }, output: { answer: 'found it' } }])
    })
})
