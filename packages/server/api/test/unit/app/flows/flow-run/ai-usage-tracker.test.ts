import {
    AI_PIECE_NAME,
    ContentBlockType,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    StepOutput,
    StepOutputStatus,
    StepOutputType,
} from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { aiUsageExtractor } from '../../../../../src/app/flows/flow-run/ai-usage-extractor'

const RUN_AGENT = 'run_agent'
const ASK_AI = 'askAi'

function aiAction({ name, actionName, input }: { name: string, actionName: string, input?: Record<string, unknown> }) {
    return {
        name,
        type: FlowActionType.PIECE,
        settings: {
            pieceName: AI_PIECE_NAME,
            actionName,
            input: input ?? {},
        },
        nextAction: undefined,
    }
}

function loopAction({ name, firstLoopAction }: { name: string, firstLoopAction: Record<string, unknown> }) {
    return {
        name,
        type: FlowActionType.LOOP_ON_ITEMS,
        settings: { items: '{{ [] }}' },
        firstLoopAction,
        nextAction: undefined,
    }
}

function flowVersionWith(actions: Record<string, unknown>[]): FlowVersion {
    const chained = actions.reduceRight<unknown>((next, action) => ({ ...action, nextAction: next }), undefined)
    return {
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            nextAction: chained,
        },
    } as unknown as FlowVersion
}

function toolCallBlock() {
    return { type: ContentBlockType.TOOL_CALL, toolName: 'store-put', toolCallId: 'id', status: 'completed', input: {} }
}

function markdownBlock() {
    return { type: ContentBlockType.MARKDOWN, markdown: 'hi' }
}

function steps(record: Record<string, unknown>): Record<string, StepOutput> {
    return record as Record<string, StepOutput>
}

const noopFetchSlice = vi.fn(async () => undefined)

describe('aiUsageTracker extractor', () => {
    it('returns zero usage for a run with no AI steps', async () => {
        const flowVersion = flowVersionWith([])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({ trigger: { type: FlowTriggerType.EMPTY, status: StepOutputStatus.SUCCEEDED } }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({ messages: 0, toolCalls: 0, breakdown: [] })
    })

    it('counts a succeeded askAI step as one message with its provider/model', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'step_1', actionName: ASK_AI })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                step_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { provider: 'openai', model: 'gpt-4o' },
                    output: 'answer',
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({
            messages: 1,
            toolCalls: 0,
            breakdown: [{ provider: 'openai', model: 'gpt-4o', messages: 1, toolCalls: 0 }],
        })
    })

    it('excludes a failed non-agent AI step', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'step_1', actionName: ASK_AI })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                step_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.FAILED,
                    input: { provider: 'openai', model: 'gpt-4o' },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({ messages: 0, toolCalls: 0, breakdown: [] })
    })

    it('counts a run_agent step as message + tool calls', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'agent_1', actionName: RUN_AGENT })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    output: { status: 'COMPLETED', steps: [markdownBlock(), toolCallBlock(), markdownBlock()] },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({
            messages: 1,
            toolCalls: 1,
            breakdown: [{ provider: 'anthropic', model: 'claude', messages: 1, toolCalls: 1 }],
        })
    })

    it('counts a markdown-only run_agent as one message with zero tool calls', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'agent_1', actionName: RUN_AGENT })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    output: { status: 'COMPLETED', steps: [markdownBlock()] },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.messages).toBe(1)
        expect(usage.toolCalls).toBe(0)
    })

    it('counts a FAILED run_agent that still made tool calls', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'agent_1', actionName: RUN_AGENT })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.FAILED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    output: { status: 'FAILED', steps: [toolCallBlock(), toolCallBlock()] },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({
            messages: 1,
            toolCalls: 2,
            breakdown: [{ provider: 'anthropic', model: 'claude', messages: 1, toolCalls: 2 }],
        })
    })

    it('does not count a run_agent that crashed with no output', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'agent_1', actionName: RUN_AGENT })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.FAILED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    output: undefined,
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({ messages: 0, toolCalls: 0, breakdown: [] })
    })

    it('counts each loop iteration of an AI step', async () => {
        const flowVersion = flowVersionWith([loopAction({ name: 'loop_1', firstLoopAction: aiAction({ name: 'step_1', actionName: ASK_AI }) })])
        const iteration = {
            step_1: {
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { provider: 'openai', model: 'gpt-4o' },
            },
        }
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                loop_1: {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    status: StepOutputStatus.SUCCEEDED,
                    output: { iterations: [iteration, iteration, iteration] },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.messages).toBe(3)
        expect(usage.breakdown).toEqual([{ provider: 'openai', model: 'gpt-4o', messages: 3, toolCalls: 0 }])
    })

    it('counts an AI step nested inside loops within loops', async () => {
        const flowVersion = flowVersionWith([
            loopAction({
                name: 'loop_1',
                firstLoopAction: loopAction({
                    name: 'loop_2',
                    firstLoopAction: aiAction({ name: 'step_1', actionName: ASK_AI }),
                }),
            }),
        ])
        const innerIteration = {
            step_1: {
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { provider: 'openai', model: 'gpt-4o' },
            },
        }
        const outerIteration = {
            loop_2: {
                type: FlowActionType.LOOP_ON_ITEMS,
                status: StepOutputStatus.SUCCEEDED,
                output: { iterations: [innerIteration, innerIteration] },
            },
        }
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                loop_1: {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    status: StepOutputStatus.SUCCEEDED,
                    output: { iterations: [outerIteration, outerIteration] },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.messages).toBe(4)
        expect(usage.breakdown).toEqual([{ provider: 'openai', model: 'gpt-4o', messages: 4, toolCalls: 0 }])
    })

    it('skips loops whose subtree has no AI step', async () => {
        const flowVersion = flowVersionWith([
            loopAction({ name: 'loop_1', firstLoopAction: aiAction({ name: 'step_1', actionName: ASK_AI }) }),
        ])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                loop_2: {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    status: StepOutputStatus.SUCCEEDED,
                    output: {
                        iterations: [{
                            other_step: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.SUCCEEDED,
                                input: { provider: 'openai', model: 'gpt-4o' },
                            },
                        }],
                    },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({ messages: 0, toolCalls: 0, breakdown: [] })
    })

    it('counts every iteration of a large AI loop that crosses the event-loop yield threshold', async () => {
        const flowVersion = flowVersionWith([loopAction({ name: 'loop_1', firstLoopAction: aiAction({ name: 'step_1', actionName: ASK_AI }) })])
        const iteration = {
            step_1: {
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { provider: 'openai', model: 'gpt-4o' },
            },
        }
        const iterationCount = 2500
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                loop_1: {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    status: StepOutputStatus.SUCCEEDED,
                    output: { iterations: Array.from({ length: iterationCount }, () => iteration) },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.messages).toBe(iterationCount)
        expect(usage.breakdown).toEqual([{ provider: 'openai', model: 'gpt-4o', messages: iterationCount, toolCalls: 0 }])
    })

    it('counts only the tested step in single-step test mode, ignoring seeded sample-data AI steps', async () => {
        const flowVersion = flowVersionWith([
            aiAction({ name: 'step_1', actionName: ASK_AI }),
            aiAction({ name: 'agent_1', actionName: RUN_AGENT }),
        ])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                // The tested step that actually executed this run.
                step_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { provider: 'openai', model: 'gpt-4o' },
                },
                // Seeded sample data from a prior test: SUCCEEDED with cached agent output, but not run now.
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    output: { status: 'COMPLETED', steps: [toolCallBlock(), toolCallBlock()] },
                },
            }),
            flowVersion,
            stepNameToTest: 'step_1',
            fetchSlice: noopFetchSlice,
        })
        expect(usage).toEqual({
            messages: 1,
            toolCalls: 0,
            breakdown: [{ provider: 'openai', model: 'gpt-4o', messages: 1, toolCalls: 0 }],
        })
    })

    it('groups breakdown per provider/model across a multi-model run', async () => {
        const flowVersion = flowVersionWith([
            aiAction({ name: 'step_1', actionName: ASK_AI }),
            aiAction({ name: 'step_2', actionName: ASK_AI }),
            aiAction({ name: 'step_3', actionName: ASK_AI }),
        ])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                step_1: { type: FlowActionType.PIECE, status: StepOutputStatus.SUCCEEDED, input: { provider: 'openai', model: 'gpt-4o' } },
                step_2: { type: FlowActionType.PIECE, status: StepOutputStatus.SUCCEEDED, input: { provider: 'openai', model: 'gpt-4o' } },
                step_3: { type: FlowActionType.PIECE, status: StepOutputStatus.SUCCEEDED, input: { provider: 'anthropic', model: 'claude' } },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.messages).toBe(3)
        expect(usage.breakdown).toEqual([
            { provider: 'openai', model: 'gpt-4o', messages: 2, toolCalls: 0 },
            { provider: 'anthropic', model: 'claude', messages: 1, toolCalls: 0 },
        ])
    })

    it('falls back to flow-version settings when the logged model is redacted', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'step_1', actionName: ASK_AI, input: { provider: 'openai', model: 'gpt-4o' } })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                step_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { provider: '**REDACTED**', model: '**REDACTED**' },
                },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.breakdown).toEqual([{ provider: 'openai', model: 'gpt-4o', messages: 1, toolCalls: 0 }])
    })

    it('reports unknown provider/model when neither log nor settings has them', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'step_1', actionName: ASK_AI })])
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                step_1: { type: FlowActionType.PIECE, status: StepOutputStatus.SUCCEEDED, input: {} },
            }),
            flowVersion,
            fetchSlice: noopFetchSlice,
        })
        expect(usage.breakdown).toEqual([{ provider: 'unknown', model: 'unknown', messages: 1, toolCalls: 0 }])
    })

    it('fetches the slice file for a sliced run_agent output and counts its tool calls', async () => {
        const flowVersion = flowVersionWith([aiAction({ name: 'agent_1', actionName: RUN_AGENT })])
        const fetchSlice = vi.fn(async () => ({
            status: 'COMPLETED',
            steps: [toolCallBlock(), toolCallBlock(), markdownBlock()],
        }))
        const usage = await aiUsageExtractor.extractAiUsage({
            steps: steps({
                agent_1: {
                    type: FlowActionType.PIECE,
                    status: StepOutputStatus.SUCCEEDED,
                    input: { aiProviderModel: { provider: 'anthropic', model: 'claude' } },
                    outputType: StepOutputType.SLICE,
                    output: { fileId: 'file-1', size: 99999, url: 'http://x' },
                },
            }),
            flowVersion,
            fetchSlice,
        })
        expect(fetchSlice).toHaveBeenCalledTimes(1)
        expect(usage).toEqual({
            messages: 1,
            toolCalls: 2,
            breakdown: [{ provider: 'anthropic', model: 'claude', messages: 1, toolCalls: 2 }],
        })
    })
})
