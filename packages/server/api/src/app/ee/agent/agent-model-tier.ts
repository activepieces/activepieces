import { isNil, PlatformId } from '@activepieces/core-utils'
import { ModelTierSurface } from '@activepieces/server-utils'
import { AgentModelCandidate } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiModelCandidates, TierConfigCandidate, TierConfigs } from '../../ai/ai-model-candidates'
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
})

function withBudget({ configs, consoleBudget }: { configs: TierConfigs, consoleBudget: number }): AgentTierCandidate[] {
    const thinkingBudget = configs.tier.thinkingBudget ?? consoleBudget
    return configs.candidates.map((candidate) => ({ ...candidate, thinkingBudget }))
}

function toWorkerCandidate({ config, modelId, status, thinkingBudget }: AgentTierCandidate): AgentModelCandidate {
    return { ...config, providerConfigId: config.configId, modelId, status, thinkingBudget }
}

export const agentTierCandidates = { toWorkerCandidate }

export type AgentTierCandidate = TierConfigCandidate & {
    thinkingBudget: number
}

export type AgentTierRun = {
    tier: { id: string, name: string }
    candidates: AgentTierCandidate[]
    fast: AgentTierCandidate | null
}
