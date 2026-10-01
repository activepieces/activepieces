import { ActivepiecesError, AiProviderKeyStatus, AIProviderName, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { GetProviderConfigResponse, ResolveAiModelCandidatesResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from './ai-provider-service'
import { platformModelTierService, TierForRun } from './platform-model-tier-service'

export const aiModelCandidates = (log: FastifyBaseLogger) => ({
    async firstCandidate({ platformId, tierId }: { platformId: PlatformId, tierId: string }): Promise<FirstCandidate> {
        const { entries: [first] } = await platformModelTierService.getForRun({ platformId, id: tierId })
        return { provider: first.key.provider, providerConfigId: first.key.id, modelId: first.modelId }
    },

    async resolve({ platformId, tierId }: { platformId: PlatformId, tierId: string }): Promise<ResolveAiModelCandidatesResponse> {
        const { tier, candidates } = await this.resolveConfigs({ platformId, tierId })
        return {
            tierName: tier.name,
            candidates: candidates.map(({ config, modelId, status }) => ({ ...config, providerConfigId: config.configId, modelId, status })),
        }
    },

    async resolveConfigs({ platformId, tierId }: { platformId: PlatformId, tierId: string }): Promise<TierConfigs> {
        const forRun = await platformModelTierService.getForRun({ platformId, id: tierId })
        const candidates = await readableCandidates({ platformId, forRun, log })
        if (candidates.length === 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `No model in tier "${forRun.tier.name}" can run` } })
        }
        return { tier: forRun.tier, candidates }
    },

    async resolveFastConfig({ platformId }: { platformId: PlatformId }): Promise<TierConfigs | null> {
        const forRun = await platformModelTierService.getFastForRun({ platformId })
        if (isNil(forRun)) {
            return null
        }
        const candidates = await readableCandidates({ platformId, forRun, log })
        return candidates.length === 0 ? null : { tier: forRun.tier, candidates }
    },

    async grantedEntryConfig({ platformId, tierId, configId, modelId }: { platformId: PlatformId, tierId: string, configId: string, modelId: string }): Promise<GetProviderConfigResponse | null> {
        const [run, fast] = await Promise.all([
            platformModelTierService.getForRun({ platformId, id: tierId }),
            platformModelTierService.getFastForRun({ platformId }),
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
