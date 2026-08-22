import { AIProviderName, isNil } from '@activepieces/core-utils'
import { AIProviderModelMetadata } from '@activepieces/shared'
import catalogFile from './model-catalog.generated.json'

export const modelCatalog = {
    lookup({ provider, modelId }: { provider: AIProviderName, modelId: string }): AIProviderModelMetadata | undefined {
        const source = CATALOG_SOURCE_PROVIDER[provider] ?? provider
        const models = catalog[source]
        if (isNil(models)) {
            return undefined
        }
        return models[normalizeModelId({ provider: source, modelId })]
    },
}

function normalizeModelId({ provider, modelId }: { provider: AIProviderName, modelId: string }): string {
    if (provider !== AIProviderName.BEDROCK) {
        return modelId
    }
    return modelId.replace(BEDROCK_INFERENCE_PROFILE_PREFIX, '')
}

const BEDROCK_INFERENCE_PROFILE_PREFIX = /^(us|eu|apac|global)\./

const CATALOG_SOURCE_PROVIDER: Partial<Record<AIProviderName, AIProviderName>> = {
    [AIProviderName.ACTIVEPIECES]: AIProviderName.OPENROUTER,
}

const catalog: Partial<Record<AIProviderName, Record<string, AIProviderModelMetadata>>> = catalogFile
