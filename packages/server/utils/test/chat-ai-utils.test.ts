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

    it('returns the last step (which on this provider is cumulative — holds every earlier step)', () => {
        // The provider's `response.messages` is cumulative: each step already contains every prior
        // step's assistant/tool messages, so the LAST step holds the full set. Flat-mapping would
        // re-emit the earlier steps in a 4,3,2,1 staircase (the bug this guards against).
        const steps = [
            { response: { messages: [listCall, listResult] } },
            { response: { messages: [listCall, listResult, finalText] } },
        ]
        const result = chatAiUtils.collectStepMessages(steps)
        expect(result).toEqual([listCall, listResult, finalText])
        // The regression this guards: the tool call + its result must survive (the last step carries them).
        expect(result).toContainEqual(listResult)
        // And no duplication from flat-mapping the staircase.
        expect(result.filter((m) => m === listCall).length).toBe(1)
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

    it('pins discovered schemas: a stale ap_get_piece_props result is never collapsed', () => {
        const big = 'z'.repeat(2000)
        const schemaMessage: ModelMessage = {
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId: 'schema', toolName: 'ap_get_piece_props', output: { type: 'text', value: big } }],
        }
        // schema result first (oldest/stalest), then 9 ordinary big results.
        const messages: ModelMessage[] = [schemaMessage, ...Array.from({ length: 9 }, (_, i) => toolResultMessage({ id: `c${i}`, outputText: big }))]
        const out = chatAiUtils.collapseStaleToolOutputs({ messages })
        const outputAt = (idx: number): string => JSON.stringify(Array.isArray(out[idx].content) ? out[idx].content[0] : undefined)

        expect(outputAt(0)).toContain(big) // schema preserved despite being the stalest
        expect(outputAt(0)).not.toContain('omitted to save context')
        expect(outputAt(1)).toContain('omitted to save context') // ordinary stale result still collapses
    })
})

describe('estimateTokenCount', () => {
    it('grows with message size and system prompt length', () => {
        const small = chatAiUtils.estimateTokenCount({ messages: [{ role: 'user', content: 'hi' }], systemPromptLength: 0 })
        const large = chatAiUtils.estimateTokenCount({ messages: [{ role: 'user', content: 'x'.repeat(4000) }], systemPromptLength: 4000 })
        expect(large).toBeGreaterThan(small)
    })
})

describe('findDataArray', () => {
    it('detects a top-level array', () => {
        expect(chatAiUtils.findDataArray([1, 2, 3])).toEqual({ array: [1, 2, 3], path: 'root' })
    })

    it('detects a nested data/results/records array (Attio-style { data: [...] })', () => {
        expect(chatAiUtils.findDataArray({ data: [{ id: 1 }] })?.path).toBe('data')
        expect(chatAiUtils.findDataArray({ results: [1] })?.path).toBe('results')
        expect(chatAiUtils.findDataArray({ records: [1] })?.path).toBe('records')
    })

    it('returns null when there is no array payload', () => {
        expect(chatAiUtils.findDataArray({ id: 1, name: 'x' })).toBeNull()
        expect(chatAiUtils.findDataArray('plain string')).toBeNull()
    })
})

describe('buildLargeResultPreview', () => {
    it('previews a record array, reports the count, and points to the fileId for the rest', () => {
        const payload = { data: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Deal ${i}`, history: 'x'.repeat(5000) })) }
        const text = chatAiUtils.buildLargeResultPreview({ payload, byteSize: 1_400_000, fileId: 'file_abc', label: 'List deals' })
        expect(text).toContain('50 record(s) at "data"')
        expect(text).toContain('file_abc')
        expect(text).toContain('ap_run_code')
        expect(text).toContain('inputs.data')
        // values are clipped, not the full 5000-char history
        expect(text.length).toBeLessThan(4000)
    })

    it('clips deep/long values so the preview never reproduces the blob', () => {
        const payload = [{ id: 1, blob: 'y'.repeat(10_000), nested: { deep: { deeper: { deepest: 'z'.repeat(10_000) } } } }]
        const text = chatAiUtils.buildLargeResultPreview({ payload, byteSize: 200_000, fileId: 'f1' })
        expect(text).not.toContain('y'.repeat(1000))
        expect(text).not.toContain('z'.repeat(1000))
    })

    it('without a fileId, steers toward narrowing/paginating instead of a dead-end', () => {
        const payload = { data: Array.from({ length: 10 }, (_, i) => ({ id: i })) }
        const text = chatAiUtils.buildLargeResultPreview({ payload, byteSize: 200_000 })
        expect(text.toLowerCase()).toMatch(/paginate|filter|narrow/)
        expect(text).not.toContain('undefined')
    })
})
