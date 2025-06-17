import { ActivepiecesError, DALLE2PricingPerImage, DALLE3PricingPerImage, ErrorCode } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { calculateTokensCost, getProviderConfig } from './utils'

export const openaiProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>
        return body.model
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const apiResponse = response as {
            usage: 
            | { input_tokens: number, output_tokens: number }
            | { prompt_tokens: number, completion_tokens: number }
        } 
        const body = request.body as { size: string, n?: string, quality?: string }
        const { provider } = request.params as { provider: string }

        const providerConfig = getProviderConfig(provider)!
        const model = openaiProvider.extractModelId(request)!
        const size = body.size
        const imageCount = parseInt(body.n as string ?? '1')
        const quality = (body.quality ?? 'standard') as 'standard' | 'hd'

        const languageModelConfig = providerConfig.languageModels.find((m) => m.instance.modelId === model)
        const imageModelConfig = providerConfig.imageModels.find((m) => m.instance.modelId === model)
        if (!languageModelConfig && !imageModelConfig) {
            throw new ActivepiecesError({
                code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                params: {
                    provider,
                    model,
                },
            })
        }
        if (languageModelConfig) {
            let inputTokens: number
            let outputTokens: number
            if ('prompt_tokens' in apiResponse.usage) {
                inputTokens = apiResponse.usage.prompt_tokens
                outputTokens = apiResponse.usage.completion_tokens
            }
            else {
                inputTokens = apiResponse.usage.input_tokens
                outputTokens = apiResponse.usage.output_tokens
            }

            const { input, output } = languageModelConfig.pricing
            return {
                cost: calculateTokensCost(inputTokens, outputTokens, input, output),
                model,
            }
        }

        if (imageModelConfig?.instance.modelId === 'dall-e-3') {
            const pricing = imageModelConfig.pricing as DALLE3PricingPerImage
            const imageCost = pricing[quality][size as keyof typeof pricing[typeof quality]]
            return {
                cost: imageCost * imageCount,
                model,
            }
        }

        const pricing = imageModelConfig?.pricing as DALLE2PricingPerImage
        const imageCost = pricing['standard'][size as keyof typeof pricing['standard']]
        return {
            cost: imageCost * imageCount,
            model,
        }
    },
} 