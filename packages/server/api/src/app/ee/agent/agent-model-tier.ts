import { ActivepiecesError, AIProviderName, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { modelCatalog, ModelTierSurface } from '@activepieces/server-utils'
import { AgentConversation, AgentModelCandidate } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ProviderScope } from '../../ai/ai-key-scope'
import { aiModelCandidates, FirstCandidate, TierConfigCandidate, TierConfigs } from '../../ai/ai-model-candidates'
import { platformModelTierService } from '../../ai/platform-model-tier-service'
import { agentModelResolution } from './agent-model-resolution'

export const agentModelTier = (log: FastifyBaseLogger) => ({
    async resolveRun({ platformId, tierId, surface, scope }: { platformId: PlatformId, tierId: string, surface: ModelTierSurface, scope: ProviderScope }): Promise<AgentTierRun> {
        const [resolved, resolvedFast, callsTools] = await Promise.all([
            aiModelCandidates(log).resolveConfigs({ platformId, tierId, scope }),
            aiModelCandidates(log).resolveFastConfig({ platformId, scope }),
            toolCallingCheck(),
        ])
        const run = toolCallingConfigs({ configs: resolved, callsTools })
        if (isNil(run)) {
            throw noToolCallingError({ tierName: resolved.tier.name })
        }
        const fast = isNil(resolvedFast) ? null : toolCallingConfigs({ configs: resolvedFast, callsTools })
        const consoleBudget = agentModelResolution.resolveTier({ tierId: null, surface }).thinkingBudget
        const candidates = withBudget({ configs: run, consoleBudget })
        const fastIsThisTier = isNil(fast) || fast.tier.id === run.tier.id
        return {
            tier: { id: run.tier.id, name: run.tier.name },
            candidates,
            fast: fastIsThisTier ? null : withBudget({ configs: fast, consoleBudget })[0],
        }
    },

    async assertUsable({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<void> {
        const [{ tier, entries }, callsTools] = await Promise.all([
            platformModelTierService.getForRun({ platformId, id: tierId, scope }),
            toolCallingCheck(),
        ])
        const main = tier.entries[0]
        const mainEntry = entries.find((entry) => entry.key.id === main.configId && entry.modelId === main.modelId)
        if (isNil(mainEntry) || !callsTools({ provider: mainEntry.key.provider, modelId: mainEntry.modelId })) {
            throw noToolCallingError({ tierName: tier.name })
        }
    },

    async mainModelOf({ conversation }: { conversation: Pick<AgentConversation, 'platformId' | 'modelTierId'> }): Promise<FirstCandidate | null> {
        const tierId = conversation.modelTierId
        if (isNil(tierId)) {
            return null
        }
        const { data } = await tryCatch(() => aiModelCandidates(log).firstCandidates({ platformId: conversation.platformId, tierIds: [tierId] }))
        return data?.get(tierId) ?? null
    },

    async mainModelsOf({ conversations }: { conversations: Pick<AgentConversation, 'platformId' | 'modelTierId'>[] }): Promise<Map<string, FirstCandidate | null>> {
        const tierIdsByPlatform = new Map<string, string[]>()
        conversations.forEach(({ platformId, modelTierId }) => {
            if (!isNil(modelTierId)) {
                tierIdsByPlatform.set(platformId, [...(tierIdsByPlatform.get(platformId) ?? []), modelTierId])
            }
        })
        const perPlatform = await Promise.all([...tierIdsByPlatform].map(async ([platformId, tierIds]): Promise<[string, FirstCandidate | null][]> => {
            const { data, error } = await tryCatch(() => aiModelCandidates(log).firstCandidates({ platformId, tierIds }))
            if (!isNil(error) || isNil(data)) {
                log.warn({ error, platform: { id: platformId }, tierCount: tierIds.length }, '[agentModelTier] Could not resolve the tiers of a platform in one pass, each conversation will look its tier up on its own')
                return []
            }
            return tierIds.map((tierId) => [tierCacheKey({ platformId, tierId }), data.get(tierId) ?? null])
        }))
        return new Map(perPlatform.flat())
    },
})

async function toolCallingCheck(): Promise<CallsTools> {
    const catalog = await modelCatalog.load()
    return ({ provider, modelId }) => catalog.lookup({ provider, modelId })?.supportsToolCalling !== false
}

function toolCallingConfigs({ configs, callsTools }: { configs: TierConfigs, callsTools: CallsTools }): TierConfigs | null {
    const main = configs.tier.entries[0]
    const mainCandidate = configs.candidates.find((candidate) => candidate.config.configId === main.configId && candidate.modelId === main.modelId)
    const toolCalling = configs.candidates.filter((candidate) => callsTools({ provider: candidate.config.provider, modelId: candidate.modelId }))
    const mainRefused = !isNil(mainCandidate) && !toolCalling.includes(mainCandidate)
    return mainRefused || toolCalling.length === 0 ? null : { tier: configs.tier, candidates: toolCalling }
}

function noToolCallingError({ tierName }: { tierName: string }): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `The main model of tier "${tierName}" can't call tools, so agents and chat can't use it` } })
}

function tierCacheKey({ platformId, tierId }: { platformId: string, tierId: string }): string {
    return `${platformId}:${tierId}`
}

function withBudget({ configs, consoleBudget }: { configs: TierConfigs, consoleBudget: number }): AgentTierCandidate[] {
    const thinkingBudget = configs.tier.thinkingBudget ?? consoleBudget
    return configs.candidates.map((candidate) => ({ ...candidate, thinkingBudget }))
}

function toWorkerCandidate({ config, modelId, status, thinkingBudget }: AgentTierCandidate): AgentModelCandidate {
    return { ...config, providerConfigId: config.configId, modelId, status, thinkingBudget }
}

export const agentTierCandidates = { toWorkerCandidate, tierCacheKey }

export type AgentTierCandidate = TierConfigCandidate & {
    thinkingBudget: number
}

type CallsTools = (model: { provider: AIProviderName, modelId: string }) => boolean

export type AgentTierRun = {
    tier: { id: string, name: string }
    candidates: AgentTierCandidate[]
    fast: AgentTierCandidate | null
}
