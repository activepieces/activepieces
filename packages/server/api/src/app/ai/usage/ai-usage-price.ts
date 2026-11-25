import { AIProviderName, isNil } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'

export const aiUsagePrice = {
    async estimateUsd({ provider, modelId, tokens }: EstimateParams): Promise<number | undefined> {
        if (isNil(tokens.inputTokens) && isNil(tokens.outputTokens)) {
            return undefined
        }
        const catalog = await modelCatalog.load()
        const price = catalog.lookup({ provider, modelId })
        if (isNil(price) || isNil(price.inputCostPerMillionTokens) || isNil(price.outputCostPerMillionTokens)) {
            return undefined
        }
        const cacheRead = tokens.cacheReadTokens ?? 0
        const cacheWrite = tokens.cacheWriteTokens ?? 0
        const uncachedInput = Math.max((tokens.inputTokens ?? 0) - cacheRead - cacheWrite, 0)
        const dollars = uncachedInput * price.inputCostPerMillionTokens
            + cacheRead * (price.cacheReadCostPerMillionTokens ?? price.inputCostPerMillionTokens)
            + cacheWrite * (price.cacheWriteCostPerMillionTokens ?? price.inputCostPerMillionTokens)
            + (tokens.outputTokens ?? 0) * price.outputCostPerMillionTokens
        return dollars / TOKENS_PER_MILLION
    },
}

const TOKENS_PER_MILLION = 1_000_000

type EstimateParams = {
    provider: AIProviderName
    modelId: string
    tokens: {
        inputTokens?: number
        outputTokens?: number
        cacheReadTokens?: number
        cacheWriteTokens?: number
    }
}
