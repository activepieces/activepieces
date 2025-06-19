import { CategorizedLanguageModelPricing, TieredLanguageModelPricing } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { calculateTokensCost, getProviderConfig } from './utils'

export const googleProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        // https://generativelanguage.googleapis.com/v1beta/{model=models/*}:streamGenerateContent
        const url = request.url
        const modelMatch = url.match(/\/models\/([^/:]+)/)
        return modelMatch ? modelMatch[1] : null
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const apiResponse = response as {
            usageMetadata: {
                promptTokenCount: number
                candidatesTokenCount: number
                thoughtsTokenCount?: number
                promptTokensDetails: {
                    modality: 'MODALITY_UNSPECIFIED' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
                    tokenCount: number
                }[]
            }
        }
        const { promptTokenCount, candidatesTokenCount, promptTokensDetails, thoughtsTokenCount } = apiResponse.usageMetadata
        const { provider } = request.params as { provider: string }

        const providerConfig = getProviderConfig(provider)!
        const model = googleProvider.extractModelId(request)!
        const pricing = providerConfig.languageModels.find((m) => m.instance.modelId === model)!.pricing 

        let cost = 0

        if (typeof pricing === 'number') {
            const { input: inputCost, output: outputCost } = pricing
            cost += calculateTokensCost(promptTokenCount, inputCost) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
        }
        else if (pricing.input instanceof Object && 'audio' in pricing.input) {
            const { input, output: outputCost } = pricing as CategorizedLanguageModelPricing
            cost += calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)

            promptTokensDetails.forEach((detail) => {
                const inputCost = detail.modality === 'AUDIO' ? input.audio : input.default
                cost += calculateTokensCost(detail.tokenCount, inputCost)
            })
        }
        else {
            const { input, output } = pricing as TieredLanguageModelPricing

            const inputCost = promptTokenCount <= input.threshold ? input.underThresholdRate : input.overThresholdRate
            const outputCost = candidatesTokenCount <= output.threshold ? output.underThresholdRate : output.overThresholdRate
            cost += calculateTokensCost(promptTokenCount, inputCost) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
        }

        return {
            cost,
            model,
        }
    },
} 