import { isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { ModelTierSurface } from '@activepieces/server-utils'
import { AgentConversation, AgentModelCandidate } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiModelCandidates, FirstCandidate, TierConfigCandidate, TierConfigs } from '../../ai/ai-model-candidates'
import { agentModelResolution } from './agent-model-resolution'

export const agentModelTier = (log: FastifyBaseLogger) => ({
    async resolveRun({ platformId, tierId, surface }: { platformId: PlatformId, tierId: string, surface: ModelTierSurface }): Promise<AgentTierRun> {
        const [run, fast] = await Promise.all([
            aiModelCandidates(log).resolveConfigs({ platformId, tierId }),
            aiModelCandidates(log).resolveFastConfig({ platformId }),
        ])
        const consoleBudget = agentModelResolution.resolveTier({ tierId: null, surface }).thinkingBudget
        const candidates = withBudget({ configs: run, consoleBudget })
        const fastIsThisTier = isNil(fast) || fast.tier.id === run.tier.id
        return {
            tier: { id: run.tier.id, name: run.tier.name },
            candidates,
            fast: fastIsThisTier ? null : withBudget({ configs: fast, consoleBudget })[0],
        }
    },

    async mainModelOf({ conversation }: { conversation: Pick<AgentConversation, 'platformId' | 'modelTierId'> }): Promise<FirstCandidate | null> {
        const tierId = conversation.modelTierId
        if (isNil(tierId)) {
            return null
        }
        const models = await this.mainModelsOf({ conversations: [conversation] })
        return models.get(tierCacheKey({ platformId: conversation.platformId, tierId })) ?? null
    },

    async mainModelsOf({ conversations }: { conversations: Pick<AgentConversation, 'platformId' | 'modelTierId'>[] }): Promise<Map<string, FirstCandidate | null>> {
        const tierIdsByPlatform = new Map<string, string[]>()
        conversations.forEach(({ platformId, modelTierId }) => {
            if (!isNil(modelTierId)) {
                tierIdsByPlatform.set(platformId, [...(tierIdsByPlatform.get(platformId) ?? []), modelTierId])
            }
        })
        const perPlatform = await Promise.all([...tierIdsByPlatform].map(async ([platformId, tierIds]): Promise<[string, FirstCandidate | null][]> => {
            const { data } = await tryCatch(() => aiModelCandidates(log).firstCandidates({ platformId, tierIds }))
            return tierIds.map((tierId) => [tierCacheKey({ platformId, tierId }), data?.get(tierId) ?? null])
        }))
        return new Map(perPlatform.flat())
    },
})

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

export type AgentTierRun = {
    tier: { id: string, name: string }
    candidates: AgentTierCandidate[]
    fast: AgentTierCandidate | null
}
