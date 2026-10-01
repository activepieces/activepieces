import { AIProviderName, PlatformId } from '@activepieces/core-utils'
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
        const candidates = await Promise.all(entries.map(async ({ modelId, key }) => ({
            ...await aiProviderService(log).credentialsForTierKey({ platformId, key }),
            providerConfigId: key.id,
            modelId,
            status: key.status,
        })))
        return { tierName: tier.name, candidates }
    },
})

export type FirstCandidate = {
    provider: AIProviderName
    providerConfigId: string
    modelId: string
}
