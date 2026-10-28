import { AIProviderName } from '@activepieces/core-utils'
import { PersistedAgentPartType } from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a turn where the model sends malformed tool arguments', () => {
    it('runs a wrapped lazy call that left out input for a tool that takes no arguments', async () => {
        const { turn, repairCalls } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"input":{"tool":"ap_list_tables","title":"Your tables"},"doneTitle":"Checked your tables","activeTitle":"Checking your tables"}' })

        const part = turn.uiParts.find((candidate) => candidate.type === PersistedAgentPartType.TOOL_CALL)
        expect(part).toMatchObject({ toolName: 'ap_list_tables', status: 'completed', title: 'Your tables' })
        expect(repairCalls()).toBe(0)
    })

    it('finds the tool when the model left out its name, so the step is not shown as the dispatcher', async () => {
        const { turn, runCode } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"input":{"code":"export const code = async () => ({ ok: 1 })"},"title":"Testing the code runner","activeTitle":"Testing the code runner","doneTitle":"Tested the code runner"}' })

        expect(runCode).toHaveBeenCalledWith({ code: 'export const code = async () => ({ ok: 1 })' }, expect.anything())
        const part = turn.uiParts.find((candidate) => candidate.type === PersistedAgentPartType.TOOL_CALL)
        expect(part).toMatchObject({ toolName: 'ap_run_code', title: 'Testing the code runner' })
    })

    it('finds the tool when the model put its arguments at the top level with no input or name', async () => {
        const { runCode } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"code":"export const code = async () => 1","title":"Reading your tables","activeTitle":"Reading your tables","doneTitle":"Read your tables"}' })

        expect(runCode).toHaveBeenCalledWith({ code: 'export const code = async () => 1' }, expect.anything())
    })

    it('moves arguments the model put next to input back inside it', async () => {
        const { explore } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"tool":"ap_explore_data","pieceName":"@activepieces/piece-gmail","input":{"actionName":"gmail_search_email"},"max_results":"15","title":"Your inbox","activeTitle":"Reading your inbox","doneTitle":"Read your inbox"}' })

        expect(explore).toHaveBeenCalledWith({ pieceName: '@activepieces/piece-gmail', actionName: 'gmail_search_email', max_results: 15 }, expect.anything())
    })

    it('labels a lazy call the model sent without labels, so the user never sees the dispatcher', async () => {
        const { turn, search } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":"more"}}' })

        expect(search).toHaveBeenCalledWith({ query: 'more' }, expect.anything())
        const part = turn.uiParts.find((candidate) => candidate.type === PersistedAgentPartType.TOOL_CALL)
        expect(part).toMatchObject({ toolName: 'ap_web_search', title: 'Web search', input: { query: 'more', activeTitle: 'Web search', doneTitle: 'Web search' } })
    })

    it('keeps the labels the model put on a lazy call', async () => {
        const { turn } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":"more"},"title":"Rival pricing","activeTitle":"Checking rival pricing","doneTitle":"Checked rival pricing"}' })

        const part = turn.uiParts.find((candidate) => candidate.type === PersistedAgentPartType.TOOL_CALL)
        expect(part).toMatchObject({ title: 'Rival pricing', input: { activeTitle: 'Checking rival pricing', doneTitle: 'Checked rival pricing' } })
    })

    it('tells the model the labels are required', async () => {
        const { model } = await runTurnWith({ toolName: 'ap_list_flows', input: '{}' })

        const lazyTool = model.doStreamCalls[0]?.tools?.find((candidate) => candidate.name === 'ap_lazy_tool')
        expect(lazyTool).toMatchObject({ inputSchema: { required: expect.arrayContaining(['tool', 'input', 'title', 'activeTitle', 'doneTitle']) } })
    })

    it('keeps the reason a call was rejected on the saved tool part', async () => {
        const { turn, search } = await runTurnWith({ toolName: 'ap_lazy_tool', input: '{"tool":"ap_web_search","input":{"query":{"nested":true}}}' })

        expect(search).not.toHaveBeenCalled()
        const failed = turn.uiParts.find((part) => part.type === PersistedAgentPartType.TOOL_CALL && part.status === 'error')
        expect(failed).toMatchObject({ errorText: expect.stringContaining('ap_web_search') })
    })
})

async function runTurnWith({ toolName, input }: { toolName: string, input: string }) {
    const search = vi.fn(async () => RESULT)
    const lookup = vi.fn(async () => RESULT)
    const runCode = vi.fn(async () => RESULT)
    const explore = vi.fn(async () => RESULT)
    let repairs = 0
    let streams = 0
    const model = new MockLanguageModelV3({
        doStream: async () => {
            streams++
            return {
                stream: convertArrayToReadableStream(streams === 1
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: 'call-1', toolName, input },
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
        doGenerate: async () => {
            repairs++
            return {
                content: [{ type: 'text' as const, text: 'not json' }],
                finishReason: { unified: 'stop' as const, raw: 'stop' },
                usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } },
                warnings: [],
            }
        },
    })
    const tools: ToolSet = {
        ...fillerTools(),
        ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }),
        ap_research_pieces: tool({ description: 'research pieces', inputSchema: z.object({ pieceNames: z.array(z.string()), limit: z.number().optional() }), execute: lookup }),
        ap_run_code: tool({ description: 'run code', inputSchema: z.object({ code: z.string(), inputFileIds: z.array(z.string()).optional() }), execute: runCode }),
        ap_explore_data: tool({ description: 'explore data', inputSchema: z.object({ pieceName: z.string(), actionName: z.string(), max_results: z.number().optional() }), execute: explore }),
    }
    const turn = await runAgentTurn({
        models: [{ model, provider: AIProviderName.ANTHROPIC, modelId: TIER.modelId, thinkingBudget: TIER.thinkingBudget }],
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'research this' }],
        tools,
        allToolNames: Object.keys(tools),
        tier: TIER,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        sinks: { drainStream: (result) => result.consumeStream() },
        skills: { surface: 'CHAT', guides: {} },
    })
    return { turn, model, search, lookup, runCode, explore, repairCalls: () => repairs }
}

function fillerTools(): ToolSet {
    return Object.fromEntries(FILLER_TOOL_NAMES.map((name) => [name, tool({ description: `${name}.`, inputSchema: z.object({}), execute: async () => RESULT })]))
}

const FILLER_TOOL_NAMES = [
    'ap_update_thinking_status', 'ap_show_quick_replies', 'ap_list_flows', 'ap_add_step', 'ap_update_step', 'ap_build_flow',
    'ap_test_flow', 'ap_list_connections', 'ap_list_runs', 'ap_get_run', 'ap_remember', 'ap_show_questions',
    'ap_show_connection_picker', 'ap_show_connection_required', 'ap_discover_action_auth', 'ap_get_piece_props',
    'ap_resolve_property_options', 'ap_resolve_property_chain', 'ap_run_task', 'ap_list_tables',
]
const RESULT = { content: [{ type: 'text', text: 'ok' }] }
const TIER = { id: 'smart', thinkingBudget: 2_000, modelId: 'anthropic/claude-sonnet-4.6' }
const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
