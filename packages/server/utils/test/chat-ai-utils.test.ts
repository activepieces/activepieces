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
