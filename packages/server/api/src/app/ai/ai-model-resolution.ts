import { AIProviderName, isNil } from '@activepieces/core-utils'
import { modelTierCatalog } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'

function resolveTierModelId({ provider, modelId, log }: { provider: AIProviderName, modelId: string, log: FastifyBaseLogger }): string {
    if (provider !== AIProviderName.ACTIVEPIECES || modelId.length === 0 || modelId.includes('/')) {
        return modelId
    }
    const flow = modelTierCatalog.current('flow')
    const tier = flow.findTier({ tierId: modelId })
    if (isNil(tier)) {
        log.warn({ tier: { id: modelId }, surface: 'flow' }, '[aiModelResolution] Tier is no longer published; running the flow default')
    }
    return (tier ?? flow.resolveTier({ tierId: modelId })).modelId
}

export const aiModelResolution = {
    resolveTierModelId,
}
