import { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { chatAiUtils } from '../src/chat-ai-utils'

const { sanitizeTruncatedAssistantTail } = chatAiUtils

describe('sanitizeTruncatedAssistantTail', () => {
    it('returns messages unchanged when the last message is not an assistant message', () => {
        const messages: ModelMessage[] = [
            { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'call_1', toolName: 'ap_research_pieces', input: {} }] },
            { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_1', toolName: 'ap_research_pieces', output: { type: 'json', value: { ok: true } } }] },
        ]
        expect(sanitizeTruncatedAssistantTail(messages)).toEqual(messages)
    })

    it('drops a dangling tool-call with no matching tool-result', () => {
        const messages: ModelMessage[] = [
            {
                role: 'assistant',
                content: [
                    { type: 'text', text: 'Setting things up.' },
                    { type: 'tool-call', toolCallId: 'call_truncated', toolName: 'ap_show_questions', input: {} },
                ],
            },
        ]
        const result = sanitizeTruncatedAssistantTail(messages)
        expect(result).toHaveLength(1)
        expect(result[0].content).toEqual([{ type: 'text', text: 'Setting things up.' }])
    })

    it('keeps a tool-call that has a matching tool-result', () => {
        const messages: ModelMessage[] = [
            {
                role: 'assistant',
                content: [
                    { type: 'tool-call', toolCallId: 'call_done', toolName: 'ap_get_piece_props', input: {} },
                ],
            },
            { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_done', toolName: 'ap_get_piece_props', output: { type: 'json', value: {} } }] },
        ]
        expect(sanitizeTruncatedAssistantTail(messages)).toEqual(messages)
    })

    it('drops truncated reasoning parts from the final assistant message', () => {
        const messages: ModelMessage[] = [
            {
                role: 'assistant',
                content: [
                    { type: 'reasoning', text: 'I was thinking about…' },
                    { type: 'text', text: 'Partial answer' },
                ],
            },
        ]
        const result = sanitizeTruncatedAssistantTail(messages)
        expect(result[0].content).toEqual([{ type: 'text', text: 'Partial answer' }])
    })

    it('drops the final assistant message entirely when nothing valid remains', () => {
        const messages: ModelMessage[] = [
            { role: 'user', content: 'hello' },
            {
                role: 'assistant',
                content: [
                    { type: 'reasoning', text: 'truncated thinking only' },
                    { type: 'tool-call', toolCallId: 'call_x', toolName: 'ap_build_flow', input: {} },
                ],
            },
        ]
        const result = sanitizeTruncatedAssistantTail(messages)
        expect(result).toEqual([{ role: 'user', content: 'hello' }])
    })

    it('leaves earlier completed messages untouched', () => {
        const earlierAssistant: ModelMessage = {
            role: 'assistant',
            content: [
                { type: 'reasoning', text: 'complete signed thinking' },
                { type: 'tool-call', toolCallId: 'call_a', toolName: 'ap_research_pieces', input: {} },
            ],
        }
        const toolResult: ModelMessage = {
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId: 'call_a', toolName: 'ap_research_pieces', output: { type: 'json', value: {} } }],
        }
        const truncatedTail: ModelMessage = {
            role: 'assistant',
            content: [{ type: 'reasoning', text: 'cut off mid-thought' }],
        }
        const result = sanitizeTruncatedAssistantTail([earlierAssistant, toolResult, truncatedTail])
        expect(result).toEqual([earlierAssistant, toolResult])
    })

    it('returns messages unchanged when the final assistant message has string content', () => {
        const messages: ModelMessage[] = [
            { role: 'assistant', content: 'plain text answer' },
        ]
        expect(sanitizeTruncatedAssistantTail(messages)).toEqual(messages)
    })

    it('does not mutate the input array or its messages', () => {
        const messages: ModelMessage[] = [
            {
                role: 'assistant',
                content: [
                    { type: 'text', text: 'keep' },
                    { type: 'reasoning', text: 'drop' },
                ],
            },
        ]
        const snapshot = JSON.parse(JSON.stringify(messages))
        sanitizeTruncatedAssistantTail(messages)
        expect(messages).toEqual(snapshot)
    })
})

describe('collectStepMessages', () => {
    const listCall: ModelMessage = {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'call_list', toolName: 'ap_list_tables', input: {} }],
    }
    const listResult: ModelMessage = {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'call_list', toolName: 'ap_list_tables', output: { type: 'json', value: { tables: ['leads', 'orders'] } } }],
    }
    const finalText: ModelMessage = {
        role: 'assistant',
        content: [{ type: 'text', text: 'That table does not exist yet — want me to create it?' }],
    }

    it('returns the messages from every step, including the tool calls and results of earlier steps', () => {
        const steps = [
            { response: { messages: [listCall, listResult] } },
            { response: { messages: [finalText] } },
        ]
        const result = chatAiUtils.collectStepMessages(steps)
        expect(result).toEqual([listCall, listResult, finalText])
        // The regression this guards: the tool call + its result must survive, not just the last step.
        expect(result).toContainEqual(listResult)
        expect(result).not.toEqual([finalText])
    })

    it('returns an empty array when there are no steps', () => {
        expect(chatAiUtils.collectStepMessages([])).toEqual([])
    })
})

describe('buildStepParts — ap_set_build_plan', () => {
    it('emits a build-plan part carrying the buildId from output and the plan from input', () => {
        const content = [
            {
                type: 'tool-call',
                toolCallId: 'call_plan',
                toolName: 'ap_set_build_plan',
                input: {
                    phase: 'building',
                    flowName: 'Lead triage',
                    steps: [{ id: 'trigger', label: 'Gmail trigger', status: 'done' }],
                },
            },
            {
                type: 'tool-result',
                toolCallId: 'call_plan',
                toolName: 'ap_set_build_plan',
                output: { type: 'json', value: { ok: true, buildId: 'build_1' } },
            },
        ]
        const parts = chatAiUtils.buildStepParts({ content })
        const buildPlanPart = parts.find((p) => p.type === 'build-plan')
        expect(buildPlanPart).toBeDefined()
        expect(buildPlanPart).toMatchObject({
            type: 'build-plan',
            buildId: 'build_1',
            data: {
                phase: 'building',
                flowName: 'Lead triage',
                steps: [{ id: 'trigger', label: 'Gmail trigger', status: 'done' }],
            },
        })
    })

    it('does not emit a build-plan part when the output has no buildId', () => {
        const content = [
            {
                type: 'tool-call',
                toolCallId: 'call_plan',
                toolName: 'ap_set_build_plan',
                input: { phase: 'detecting', flowName: 'X', steps: [{ id: 'a', label: 'A', status: 'pending' }] },
            },
            {
                type: 'tool-result',
                toolCallId: 'call_plan',
                toolName: 'ap_set_build_plan',
                output: { type: 'json', value: { ok: true } },
            },
        ]
        const parts = chatAiUtils.buildStepParts({ content })
        expect(parts.find((p) => p.type === 'build-plan')).toBeUndefined()
    })
})

describe('buildStepParts — ap_run_code', () => {
    it('emits a file part for each produced file in the tool output', () => {
        const content = [
            {
                type: 'tool-call',
                toolCallId: 'call_code',
                toolName: 'ap_run_code',
                input: { title: 'Resize image', code: 'export const code = async () => ({})' },
            },
            {
                type: 'tool-result',
                toolCallId: 'call_code',
                toolName: 'ap_run_code',
                output: {
                    type: 'json',
                    value: {
                        text: '✅ Code ran. Returned 1 file(s) to the user: small.png.',
                        producedFiles: [
                            { fileId: 'file_1', url: 'https://api.example.com/v1/files/file_1?token=x', mediaType: 'image/png', fileName: 'small.png', byteSize: 1234 },
                        ],
                    },
                },
            },
        ]
        const parts = chatAiUtils.buildStepParts({ content })
        const filePart = parts.find((p) => p.type === 'file')
        expect(filePart).toMatchObject({
            type: 'file',
            toolCallId: 'call_code',
            fileId: 'file_1',
            url: 'https://api.example.com/v1/files/file_1?token=x',
            mediaType: 'image/png',
            fileName: 'small.png',
            byteSize: 1234,
            title: 'Resize image',
        })
    })

    it('does not emit a file part when no files were produced', () => {
        const content = [
            {
                type: 'tool-call',
                toolCallId: 'call_code',
                toolName: 'ap_run_code',
                input: { code: 'export const code = async () => ({ result: 4 })' },
            },
            {
                type: 'tool-result',
                toolCallId: 'call_code',
                toolName: 'ap_run_code',
                output: { type: 'json', value: { text: '✅ Code ran.\n\n{"result":4}', producedFiles: [] } },
            },
        ]
        const parts = chatAiUtils.buildStepParts({ content })
        expect(parts.find((p) => p.type === 'file')).toBeUndefined()
    })
})

function toolResultMessage({ id, outputText }: { id: string, outputText: string }): ModelMessage {
    return {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: id, toolName: 'ap_explore_data', output: { type: 'text', value: outputText } }],
    }
}

describe('collectAllStepMessages', () => {
    it('flattens the response messages of every step (full in-loop history)', () => {
        const a: ModelMessage = { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'ap_list_tables', input: {} }] }
        const b: ModelMessage = { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'ap_list_tables', output: { type: 'json', value: { ok: true } } }] }
        const c: ModelMessage = { role: 'assistant', content: [{ type: 'text', text: 'done' }] }
        const steps = [{ response: { messages: [a, b] } }, { response: { messages: [c] } }]
        expect(chatAiUtils.collectAllStepMessages(steps)).toEqual([a, b, c])
    })

    it('returns an empty array when there are no steps', () => {
        expect(chatAiUtils.collectAllStepMessages([])).toEqual([])
    })
})

describe('collapseStaleToolOutputs', () => {
    it('returns input unchanged when at or below the keep-recent count', () => {
        const messages: ModelMessage[] = Array.from({ length: 6 }, (_, i) => toolResultMessage({ id: `c${i}`, outputText: 'z'.repeat(2000) }))
        expect(chatAiUtils.collapseStaleToolOutputs({ messages })).toBe(messages)
    })

    it('collapses only the stale oversized outputs, keeps the most recent 6 intact, never drops a message', () => {
        const big = 'z'.repeat(2000)
        const messages: ModelMessage[] = Array.from({ length: 10 }, (_, i) => toolResultMessage({ id: `c${i}`, outputText: big }))
        const out = chatAiUtils.collapseStaleToolOutputs({ messages })

        expect(out).toHaveLength(messages.length)
        const outputAt = (idx: number): unknown => {
            const part = Array.isArray(out[idx].content) ? out[idx].content[0] : undefined
            return part && typeof part === 'object' && 'output' in part ? part.output : undefined
        }
        // 10 results, keep 6 → first 4 are stale and collapsed to a marker.
        expect(JSON.stringify(outputAt(0))).toContain('omitted to save context')
        expect(JSON.stringify(outputAt(3))).toContain('omitted to save context')
        expect(JSON.stringify(outputAt(4))).toContain(big)
        expect(JSON.stringify(outputAt(9))).toContain(big)
    })

    it('leaves stale outputs under the size threshold intact', () => {
        const messages: ModelMessage[] = Array.from({ length: 10 }, (_, i) => toolResultMessage({ id: `c${i}`, outputText: 'short' }))
        expect(chatAiUtils.collapseStaleToolOutputs({ messages })).toEqual(messages)
    })
})

describe('estimateTokenCount', () => {
    it('grows with message size and system prompt length', () => {
        const small = chatAiUtils.estimateTokenCount({ messages: [{ role: 'user', content: 'hi' }], systemPromptLength: 0 })
        const large = chatAiUtils.estimateTokenCount({ messages: [{ role: 'user', content: 'x'.repeat(4000) }], systemPromptLength: 4000 })
        expect(large).toBeGreaterThan(small)
    })
})
