import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { calculateTokensCost, getProviderConfig } from './utils'

export const anthropicProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>
        return body.model
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const apiResponse = response as { usage: { input_tokens: number, output_tokens: number } }
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

        const { input, output } = languageModelConfig.pricing
        const { input_tokens, output_tokens } = apiResponse.usage
        return {
            cost: calculateTokensCost(input_tokens, output_tokens, input, output),
            model,
        }
    },
} 