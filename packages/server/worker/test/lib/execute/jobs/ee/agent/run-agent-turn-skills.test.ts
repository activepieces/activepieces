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
        const model = scriptedModel({ toolCalls: [{ id: 'bad-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":42}}' }] })

        await runSkillsTurn({ model, search })

        expect(search).not.toHaveBeenCalled()
        expect(model.doGenerateCalls.length).toBe(0)
        expect(model.doStreamCalls.length).toBe(2)
        expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain('Invalid input for \\"ap_web_search\\"')
    })

    it('shows the model the real schema, so its next call runs the tool', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({ toolCalls: [
            { id: 'bad-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":42}}' },
            { id: 'good-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":"42"}}' },
        ] })

        await runSkillsTurn({ model, search })

        expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain('Input schema')
        expect(search).toHaveBeenCalledTimes(1)
        expect(search).toHaveBeenCalledWith({ query: '42' }, expect.objectContaining({ toolCallId: 'good-1' }))
        expect(model.doGenerateCalls.length).toBe(0)
    })
})

describe('repairing a call in skills mode', () => {
    it('repairs a wrapped call whose JSON is broken, then validates the repair before running the tool', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({
            toolCalls: [{ id: 'broken-1', toolName: 'ap_lazy_tool', input: '{ tool: "ap_web_search", input: { query: "more" }, }' }],
            repairText: '{"tool":"ap_web_search","input":{"query":"more"}}',
        })

        await runSkillsTurn({ model, search })

        expect(model.doGenerateCalls.length).toBe(1)
        expect(search).toHaveBeenCalledWith({ query: 'more' }, expect.objectContaining({ toolCallId: 'broken-1' }))
    })

    it('does not run the tool when the repaired wrapped call still has the wrong inner input', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({
            toolCalls: [{ id: 'broken-1', toolName: 'ap_lazy_tool', input: '{ tool: "ap_web_search", input: { query: 42 }, }' }],
            repairText: '{"tool":"ap_web_search","input":{"query":42}}',
        })

        await runSkillsTurn({ model, search })

        expect(model.doGenerateCalls.length).toBe(1)
        expect(search).not.toHaveBeenCalled()
    })

    it('still repairs a core tool called directly with input that fails its schema', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({
            toolCalls: [{ id: 'direct-1', toolName: 'ap_research_pieces', input: '{"query":42}' }],
            repairText: '{"query":"42"}',
        })

        await runSkillsTurn({ model, search })

        expect(model.doGenerateCalls.length).toBe(1)
        expect(model.doGenerateCalls[0]?.responseFormat).toEqual(expect.objectContaining({ type: 'json' }))
        expect(search).toHaveBeenCalledWith({ query: '42' }, expect.objectContaining({ toolCallId: 'direct-1' }))
    })

    it('runs a deferred tool called by name through ap_lazy_tool', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({ toolCalls: [{ id: 'direct-1', toolName: 'ap_web_search', input: '{"query":"more"}' }] })

        await runSkillsTurn({ model, search })

        expect(search).toHaveBeenCalledWith({ query: 'more' }, expect.objectContaining({ toolCallId: 'direct-1' }))
    })

    it('reminds the model to use ap_lazy_tool after rerouting a call it made by name', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({ toolCalls: [{ id: 'direct-1', toolName: 'ap_web_search', input: '{"query":"more"}' }] })

        await runSkillsTurn({ model, search })

        expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain('next time call ap_lazy_tool with tool: \\"ap_web_search\\"')
    })

    it('adds no reminder when the model already called ap_lazy_tool', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = scriptedModel({ toolCalls: [{ id: 'lazy-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":"more"}}' }] })

        await runSkillsTurn({ model, search })

        expect(search).toHaveBeenCalledWith({ query: 'more' }, expect.objectContaining({ toolCallId: 'lazy-1' }))
        expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).not.toContain('next time call ap_lazy_tool')
    })
})

describe('the build phase in skills mode', () => {
    async function phaseAfter({ toolCall }: { toolCall: ScriptedToolCall }): Promise<{ phase: string, secondStepThinking: unknown }> {
        const model = scriptedModel({ toolCalls: [toolCall] })
        const phaseState: { phase: 'discovery' | 'build' } = { phase: 'discovery' }
        await runAgentTurn({
            model,
            provider: AIProviderName.ANTHROPIC,
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'build it' }],
            tools: fillerTools(),
            allToolNames: Object.keys(fillerTools()),
            tier: TIER,
            modelId: TIER.modelId,
            phaseState,
            abortSignal: new AbortController().signal,
            log: SILENT_LOG,
            sinks: { drainStream: (result) => result.consumeStream() },
            skills: { surface: 'CHAT', guides: { build_flow: 'BUILD GUIDE' } },
        })
        return { phase: phaseState.phase, secondStepThinking: model.doStreamCalls[1]?.providerOptions?.['anthropic']?.['thinking'] }
    }

    it('turns thinking on once the flow building skill is loaded', async () => {
        const result = await phaseAfter({ toolCall: { id: 'load-1', toolName: 'ap_load_skill', input: '{"skills":["flow_building"]}' } })
        expect(result.phase).toBe('build')
        expect(result.secondStepThinking).toMatchObject({ type: 'enabled' })
    })

    it('turns thinking on once a build tool runs through ap_lazy_tool', async () => {
        const result = await phaseAfter({ toolCall: { id: 'add-1', toolName: 'ap_lazy_tool', input: '{"tool":"ap_add_step","input":{}}' } })
        expect(result.phase).toBe('build')
        expect(result.secondStepThinking).toMatchObject({ type: 'enabled' })
    })

    it('keeps thinking off while the agent only reads', async () => {
        const result = await phaseAfter({ toolCall: { id: 'read-1', toolName: 'ap_list_flows', input: '{}' } })
        expect(result.phase).toBe('discovery')
        expect(result.secondStepThinking).not.toMatchObject({ type: 'enabled' })
    })
})

async function runSkillsTurn({ model, search }: { model: MockLanguageModelV3, search: () => Promise<typeof SEARCH_RESULT> }): Promise<void> {
    await runAgentTurn({
        model,
        provider: AIProviderName.ANTHROPIC,
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'research this' }],
        tools: {
            ...fillerTools(),
            ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }),
            ap_research_pieces: tool({ description: 'research pieces', inputSchema: z.object({ query: z.string() }), execute: search }),
        },
        allToolNames: [...Object.keys(fillerTools()), 'ap_web_search', 'ap_research_pieces'],
        tier: TIER,
        modelId: TIER.modelId,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        sinks: { drainStream: (result) => result.consumeStream() },
        skills: { surface: 'CHAT', guides: {} },
    })
}

function scriptedModel({ toolCalls, repairText = '' }: { toolCalls: ScriptedToolCall[], repairText?: string }): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            const toolCall = toolCalls[calls]
            calls++
            return {
                stream: convertArrayToReadableStream(toolCall === undefined
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'text-start' as const, id: 'answer' },
                        { type: 'text-delta' as const, id: 'answer', delta: 'Done.' },
                        { type: 'text-end' as const, id: 'answer' },
                        { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]
                    : [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: toolCall.id, toolName: toolCall.toolName, input: toolCall.input },
                        { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]),
            }
        },
        doGenerate: async () => ({
            content: [{ type: 'text' as const, text: repairText }],
            finishReason: { unified: 'stop' as const, raw: 'stop' },
            usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } },
            warnings: [],
        }),
    })
}

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

type ScriptedToolCall = {
    id: string
    toolName: string
    input: string
}
