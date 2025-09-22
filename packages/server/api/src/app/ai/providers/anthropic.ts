import { FlatLanguageModelPricing } from '@activepieces/common-ai'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { calculateTokensCost, calculateWebSearchCost, getProviderConfig } from './utils'

export const anthropicProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>
        return body.model
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const apiResponse = response as { usage: { input_tokens: number, output_tokens: number, server_tool_use?: { web_search_requests: number } } }
        const { provider } = request.params as { provider: string }

        const providerConfig = getProviderConfig(provider)!
        const model = anthropicProvider.extractModelId(request)!

        const languageModelConfig = providerConfig.languageModels.find((m) => m.instance.modelId === model)
        if (!languageModelConfig) {
            throw new ActivepiecesError({
                code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                params: {
                    provider,
                    model,
                },
            })
        }

        const { input: inputCost, output: outputCost } = languageModelConfig.pricing as FlatLanguageModelPricing
        const webSearchCost = languageModelConfig.webSearchCost ?? 0
        const { input_tokens, output_tokens, server_tool_use } = apiResponse.usage
        const webSearchRequests = server_tool_use?.web_search_requests ?? 0
        return {
            cost: calculateTokensCost(input_tokens, inputCost) + calculateTokensCost(output_tokens, outputCost) + calculateWebSearchCost(webSearchRequests, webSearchCost),
            model,
        }
    },

    isStreaming: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        const body = request.body as { stream?: boolean }
        return body.stream ?? false
    },
}