import { ActivepiecesError, AIProviderName, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { ResolveAiModelCandidatesResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from './ai-provider-service'
import { platformModelTierService } from './platform-model-tier-service'

export const aiModelCandidates = (log: FastifyBaseLogger) => ({
    async firstCandidate({ platformId, tierId }: { platformId: PlatformId, tierId: string }): Promise<FirstCandidate> {
        const { entries: [first] } = await platformModelTierService.getForRun({ platformId, id: tierId })
        return { provider: first.key.provider, providerConfigId: first.key.id, modelId: first.modelId }
    },

    async resolve({ platformId, tierId }: { platformId: PlatformId, tierId: string }): Promise<ResolveAiModelCandidatesResponse> {
        const { tier, entries } = await platformModelTierService.getForRun({ platformId, id: tierId })
        const decrypted = await Promise.all(entries.map(async ({ modelId, key }) => {
            const { data: credentials, error } = await tryCatch(() => aiProviderService(log).credentialsForTierKey({ platformId, key }))
            if (!isNil(error) || isNil(credentials)) {
                log.warn({ error, aiProvider: { id: key.id }, platformTier: { id: tier.id } }, '[aiModelCandidates] Skipping a tier entry whose key cannot be read')
                return []
            }
            return [{ ...credentials, providerConfigId: key.id, modelId, status: key.status }]
        }))
        const candidates = decrypted.flat()
        if (candidates.length === 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `No model in tier "${tier.name}" can run` } })
        }
        return { tierName: tier.name, candidates }
    },
})

export type FirstCandidate = {
    provider: AIProviderName
    providerConfigId: string
    modelId: string
}
