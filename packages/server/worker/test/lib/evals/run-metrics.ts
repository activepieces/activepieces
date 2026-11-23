import { isNil, tryCatch } from '@activepieces/core-utils'
import { agentToolSkills } from '@activepieces/shared'
import { LanguageModelV4Usage } from '@ai-sdk/provider'
import { ToolExecutionOptions, ToolSet } from 'ai'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'

function createRecorder(): MetricsRecorder {
    const startedAt = Date.now()
    const modelCalls: ModelCall[] = []
    const toolTimings: ToolTiming[] = []

    return {
        modelCall: ({ durationMs, usage }) => {
            modelCalls.push({ durationMs, usage })
        },
        timeTools: (tools) => Object.fromEntries(Object.entries(tools).map(([toolName, tool]) => {
            const execute = tool.execute
            if (isNil(execute)) {
                return [toolName, tool]
            }
            return [toolName, {
                ...tool,
                execute: async (input: unknown, options: ToolExecutionOptions<unknown>) => {
                    const callStartedAt = Date.now()
                    const { data: output, error } = await tryCatch(async () => execute(input, options))
                    const finishedAt = Date.now()
                    toolTimings.push({ toolName: agentToolSkills.effectiveToolCall({ toolName, input }).toolName, durationMs: finishedAt - callStartedAt, finishedAtMs: finishedAt - startedAt, succeeded: isNil(error) && agentWorkerTools.isSuccessResult(output) })
                    if (!isNil(error)) {
                        throw error
                    }
                    return output
                },
            }]
        })),
        summarize: ({ toolCalls, rejectedToolCalls }) => summarize({ modelCalls, toolTimings, toolCalls, rejectedToolCalls, totalMs: Date.now() - startedAt }),
    }
}

function summarize({ modelCalls, toolTimings, toolCalls, rejectedToolCalls, totalMs }: { modelCalls: ModelCall[], toolTimings: ToolTiming[], toolCalls: CalledTool[], rejectedToolCalls: number, totalMs: number }): RunMetrics {
    const effective = toolCalls.map((call) => ({ ...agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input }), output: call.output }))
    const firstBuildIndex = effective.findIndex((call) => call.toolName === BUILD_TOOL && agentWorkerTools.isSuccessResult(call.output))
    const firstBuild = toolTimings.find((timing) => timing.toolName === BUILD_TOOL && timing.succeeded)
    return {
        totalMs,
        modelCalls: modelCalls.length,
        modelMs: sum(modelCalls.map((call) => call.durationMs)),
        modelMsPerCall: modelCalls.map((call) => call.durationMs),
        toolMs: sum(toolTimings.map((timing) => timing.durationMs)),
        inputTokens: sumTokens(modelCalls.map((call) => call.usage?.inputTokens.total)),
        cachedInputTokens: sumTokens(modelCalls.map((call) => call.usage?.inputTokens.cacheRead)),
        outputTokens: sumTokens(modelCalls.map((call) => call.usage?.outputTokens.total)),
        reasoningTokens: sumTokens(modelCalls.map((call) => call.usage?.outputTokens.reasoning)),
        toolCalls: effective.length,
        toolCallsByName: effective.reduce<Record<string, number>>((counts, call) => ({ ...counts, [call.toolName]: (counts[call.toolName] ?? 0) + 1 }), {}),
        wasted: {
            rejectedInputs: rejectedToolCalls,
            repeatedPieceProps: repeatedCalls({ calls: effective.filter((call) => call.toolName === PIECE_PROPS_TOOL) }),
            fixRoundsAfterBuild: firstBuildIndex === -1 ? 0 : effective.slice(firstBuildIndex + 1).filter((call) => FLOW_EDIT_TOOLS.has(call.toolName)).length,
        },
        firstBuildMs: firstBuild?.finishedAtMs ?? null,
    }
}

function repeatedCalls({ calls }: { calls: { input: unknown }[] }): number {
    const keys = calls.map((call) => JSON.stringify(call.input))
    return keys.length - new Set(keys).size
}

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0)
}

function sumTokens(values: (number | undefined)[]): number | null {
    return values.length > 0 && values.every(isNil) ? null : sum(values.map((value) => value ?? 0))
}

const BUILD_TOOL = 'ap_build_flow'
const PIECE_PROPS_TOOL = 'ap_get_piece_props'
const FLOW_EDIT_TOOLS = new Set(['ap_add_branch', 'ap_add_step', 'ap_apply_flow_operations', 'ap_delete_branch', 'ap_delete_step', 'ap_update_branch', 'ap_update_step', 'ap_update_trigger'])

export const runMetrics = {
    createRecorder,
    summarize,
}

export type MetricsRecorder = {
    modelCall: (params: ModelCall) => void
    timeTools: (tools: ToolSet) => ToolSet
    summarize: (params: { toolCalls: CalledTool[], rejectedToolCalls: number }) => RunMetrics
}

export type RunMetrics = {
    totalMs: number
    modelCalls: number
    modelMs: number
    modelMsPerCall: number[]
    toolMs: number
    inputTokens: number | null
    cachedInputTokens: number | null
    outputTokens: number | null
    reasoningTokens: number | null
    toolCalls: number
    toolCallsByName: Record<string, number>
    wasted: { rejectedInputs: number, repeatedPieceProps: number, fixRoundsAfterBuild: number }
    firstBuildMs: number | null
}

type ModelCall = { durationMs: number, usage: LanguageModelV4Usage | null }

type ToolTiming = { toolName: string, durationMs: number, finishedAtMs: number, succeeded: boolean }

type CalledTool = { toolName: string, input: unknown, output: unknown }
