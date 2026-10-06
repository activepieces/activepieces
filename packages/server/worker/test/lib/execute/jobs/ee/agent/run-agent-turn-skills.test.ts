import { AIProviderName } from '@activepieces/core-utils'
import { MAX_CORE_TOOLS, PersistedAgentPartType } from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a turn in skills mode', () => {
    it('sends the same capped tool list on every step and bills a wrapped call like a direct one', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const creditsLeft = vi.fn(async () => 100)
        const model = wrappedSearchThenAnswer()

        const turn = await runAgentTurn({
            model,
            provider: AIProviderName.ANTHROPIC,
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'research this' }],
            tools: { ...fillerTools(), ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }) },
            allToolNames: [...Object.keys(fillerTools()), 'ap_web_search'],
            tier: TIER,
            modelId: TIER.modelId,
            phaseState: { phase: 'discovery' },
            abortSignal: new AbortController().signal,
            log: SILENT_LOG,
            sinks: { drainStream: (result) => result.consumeStream() },
            creditsLeft,
            skills: { surface: 'CHAT', guides: {} },
        })

        const toolListsPerStep = model.doStreamCalls.map((call) => (call.tools ?? []).map((t) => t.name).join())
        expect(new Set(toolListsPerStep).size).toBe(1)
        expect(model.doStreamCalls[0]?.tools?.length).toBeLessThanOrEqual(MAX_CORE_TOOLS)
        expect(model.doStreamCalls[0]?.tools?.map((t) => t.name)).not.toContain('ap_add_step')
        expect(search).toHaveBeenCalledWith({ query: 'more' }, expect.objectContaining({ toolCallId: 'call-1' }))
        expect(creditsLeft.mock.calls[0]).toEqual([2])
        const toolParts = turn.uiParts.filter((part) => part.type === PersistedAgentPartType.TOOL_CALL)
        expect(toolParts.map((part) => part.type === PersistedAgentPartType.TOOL_CALL ? part.toolName : '')).toEqual(['ap_web_search'])
    })
})

describe('a wrapped call with the wrong input', () => {
    it('is rejected by the schema before the real tool runs, without a repair call, and the turn carries on', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        let calls = 0
        const model = new MockLanguageModelV3({
            doStream: async () => {
                calls++
                return {
                    stream: convertArrayToReadableStream(calls === 1
                        ? [
                            { type: 'stream-start' as const, warnings: [] },
                            { type: 'tool-call' as const, toolCallId: 'bad-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":42}}' },
                            { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                        ]
                        : [
                            { type: 'stream-start' as const, warnings: [] },
                            { type: 'text-start' as const, id: 'answer' },
                            { type: 'text-delta' as const, id: 'answer', delta: 'Done.' },
                            { type: 'text-end' as const, id: 'answer' },
                            { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                        ]),
                }
            },
        })

        await runAgentTurn({
            model,
            provider: AIProviderName.ANTHROPIC,
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'research this' }],
            tools: { ...fillerTools(), ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }) },
            allToolNames: [...Object.keys(fillerTools()), 'ap_web_search'],
            tier: TIER,
            modelId: TIER.modelId,
            phaseState: { phase: 'discovery' },
            abortSignal: new AbortController().signal,
            log: SILENT_LOG,
            sinks: { drainStream: (result) => result.consumeStream() },
            skills: { surface: 'CHAT', guides: {} },
        })

        expect(search).not.toHaveBeenCalled()
        expect(model.doGenerateCalls.length).toBe(0)
        expect(model.doStreamCalls.length).toBe(2)
        expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain('Invalid input for \\"ap_web_search\\"')
    })
})

function fillerTools(): ToolSet {
    return Object.fromEntries(FILLER_TOOL_NAMES.map((name) => [name, tool({ description: `${name}.`, inputSchema: z.object({}), execute: async () => SEARCH_RESULT })]))
}

function wrappedSearchThenAnswer(): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            calls++
            return {
                stream: convertArrayToReadableStream(calls === 1
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":"more"}}' },
                        { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]
                    : [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'text-start' as const, id: 'answer' },
                        { type: 'text-delta' as const, id: 'answer', delta: 'Done.' },
                        { type: 'text-end' as const, id: 'answer' },
                        { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]),
            }
        },
    })
}

const FILLER_TOOL_NAMES = [
    'ap_update_thinking_status', 'ap_show_quick_replies', 'ap_research_pieces', 'ap_list_flows',
    'ap_add_step', 'ap_update_step', 'ap_build_flow', 'ap_test_flow', 'ap_list_connections', 'ap_list_runs', 'ap_get_run',
    'ap_rename_flow', 'ap_delete_flow', 'ap_list_tables', 'ap_create_table', 'ap_find_records', 'ap_insert_records',
]

const SEARCH_RESULT = { content: [{ type: 'text', text: 'ok' }] }

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
