import { AIProviderName } from '@activepieces/core-utils'
import { aiPricingCatalog } from '@activepieces/server-utils'

function resolveTierModelId({ provider, modelId }: { provider: AIProviderName, modelId: string }): string {
    if (provider !== AIProviderName.ACTIVEPIECES || modelId.includes(MODEL_ID_SEPARATOR)) {
        return modelId
    }
    return aiPricingCatalog.current().resolveTier(modelId).modelId
}

const MODEL_ID_SEPARATOR = '/'

export const aiModelResolution = {
    resolveTierModelId,
}
