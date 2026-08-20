import { AgentUsage, AgentUsageLlmCall } from '@activepieces/shared'
import { LanguageModelUsage } from 'ai'

export function createAgentUsageCollector(): AgentUsageCollector {
    const calls: AgentUsageLlmCall[] = []
    let incomplete = false

    return {
        record({ provider, model, usage }: RecordParams): void {
            const inputTokens = finiteTokens(usage?.inputTokens)
            const outputTokens = finiteTokens(usage?.outputTokens)
            if (inputTokens === undefined || outputTokens === undefined) {
                incomplete = true
            }
            const cachedInputTokens = finiteTokens(usage?.inputTokenDetails?.cacheReadTokens)
            const cacheWriteTokens = finiteTokens(usage?.inputTokenDetails?.cacheWriteTokens)
            const reasoningTokens = finiteTokens(usage?.outputTokenDetails?.reasoningTokens)
            calls.push({
                ...(provider ? { provider } : {}),
                model,
                inputTokens: inputTokens ?? 0,
                outputTokens: outputTokens ?? 0,
                ...(cachedInputTokens !== undefined ? { cachedInputTokens } : {}),
                ...(cacheWriteTokens !== undefined ? { cacheWriteTokens } : {}),
                ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
            })
        },

        markIncomplete(): void {
            incomplete = true
        },

        snapshot(): AgentUsage | undefined {
            if (calls.length === 0) {
                return undefined
            }
            return {
                version: 1,
                calls: calls.map((call) => ({ ...call })),
                totals: {
                    inputTokens: calls.reduce((sum, call) => sum + call.inputTokens, 0),
                    outputTokens: calls.reduce((sum, call) => sum + call.outputTokens, 0),
                },
                ...(incomplete ? { incomplete: true } : {}),
            }
        },
    }
}

function finiteTokens(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

type RecordParams = {
    provider?: string
    model: string
    usage: LanguageModelUsage | undefined
}

export type AgentUsageCollector = {
    record: (params: RecordParams) => void
    markIncomplete: () => void
    snapshot: () => AgentUsage | undefined
}
