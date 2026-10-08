import { ActivepiecesError, AiProviderKeyStatus, AIProviderName, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { GetProviderConfigResponse, ResolveAiModelCandidatesResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ProviderScope } from './ai-key-scope'
import { aiProviderService } from './ai-provider-service'
import { platformModelTierService, TierForRun } from './platform-model-tier-service'

export const aiModelCandidates = (log: FastifyBaseLogger) => ({
    async firstCandidate({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<FirstCandidate> {
        const { entries: [first] } = await platformModelTierService.getForRun({ platformId, id: tierId, scope })
        return { provider: first.key.provider, providerConfigId: first.key.id, modelId: first.modelId }
    },

    async firstCandidates({ platformId, tierIds }: { platformId: PlatformId, tierIds: string[] }): Promise<Map<string, FirstCandidate | null>> {
        const tiers = await platformModelTierService.getManyForRun({ platformId, ids: tierIds })
        return new Map([...tiers].map(([tierId, forRun]) => {
            const first = forRun?.entries[0]
            return [tierId, isNil(first) ? null : { provider: first.key.provider, providerConfigId: first.key.id, modelId: first.modelId }]
        }))
    },

    async resolve({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<ResolveAiModelCandidatesResponse> {
        const { tier, candidates } = await this.resolveConfigs({ platformId, tierId, scope })
        return {
            tierName: tier.name,
            candidates: candidates.map(({ config, modelId, status }) => ({ ...config, providerConfigId: config.configId, modelId, status })),
        }
    },

    async resolveConfigs({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<TierConfigs> {
        const forRun = await platformModelTierService.getForRun({ platformId, id: tierId, scope })
        const configs = await this.configsFor({ platformId, forRun })
        if (configs.candidates.length === 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `No model in tier "${forRun.tier.name}" can run` } })
        }
        return configs
    },

    async configsFor({ platformId, forRun }: { platformId: PlatformId, forRun: TierForRun }): Promise<TierConfigs> {
        return { tier: forRun.tier, candidates: await readableCandidates({ platformId, forRun, log }) }
    },

    async grantedEntryConfig({ platformId, tierId, configId, modelId, scope }: { platformId: PlatformId, tierId: string, configId: string, modelId: string, scope: ProviderScope }): Promise<GetProviderConfigResponse | null> {
        const [run, fast] = await Promise.all([
            platformModelTierService.getForRun({ platformId, id: tierId, scope }),
            platformModelTierService.getFastForRun({ platformId, scope }),
        ])
        const entry = [...run.entries, ...(fast?.entries ?? [])].find((candidate) => candidate.key.id === configId && candidate.modelId === modelId)
        return isNil(entry) ? null : aiProviderService(log).configForTierKey({ platformId, key: entry.key })
    },
})

async function readableCandidates({ platformId, forRun, log }: { platformId: PlatformId, forRun: TierForRun, log: FastifyBaseLogger }): Promise<TierConfigCandidate[]> {
    const read = await Promise.all(forRun.entries.map(async ({ modelId, key }) => {
        const { data: config, error } = await tryCatch(() => aiProviderService(log).configForTierKey({ platformId, key }))
        if (!isNil(error) || isNil(config)) {
            log.warn({ error, aiProvider: { id: key.id }, platformTier: { id: forRun.tier.id } }, '[aiModelCandidates] Skipping a tier entry whose key cannot be read')
            return []
        }
        return [{ config, modelId, status: key.status }]
    }))
    return read.flat()
}

export type FirstCandidate = {
    provider: AIProviderName
    providerConfigId: string
    modelId: string
}

export type TierConfigCandidate = {
    config: GetProviderConfigResponse
    modelId: string
    status: AiProviderKeyStatus
}

export type TierConfigs = {
    tier: TierForRun['tier']
    candidates: TierConfigCandidate[]
}
