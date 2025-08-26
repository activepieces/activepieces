import { CategorizedLanguageModelPricing, FlatLanguageModelPricing, TieredLanguageModelPricing } from '@activepieces/common-ai'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { calculateTokensCost, calculateWebSearchCost, getProviderConfig } from './utils'

export const googleProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        // https://generativelanguage.googleapis.com/v1beta/{model=models/*}:streamGenerateContent
        const url = request.url
        const modelMatch = url.match(/\/models\/([^/:]+)/)
        return modelMatch ? modelMatch[1] : null
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage | null => {
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
            candidates: {
                groundingMetadata?: {
                    webSearchQueries: string[]
                }
            }[]
        }
        | { name: string, error?: Record<string, unknown> }

        const { provider } = request.params as { provider: string }
        const model = googleProvider.extractModelId(request)!
        const providerConfig = getProviderConfig(provider)!
        const languageModelConfig = providerConfig.languageModels.find((m) => m.instance.modelId === model)
        const videoModelConfig = providerConfig.videoModels.find((m) => m.instance.modelId === model)
        
        let cost = 0
        
        if (languageModelConfig && 'usageMetadata' in apiResponse) {
            const { promptTokenCount, candidatesTokenCount, promptTokensDetails, thoughtsTokenCount } = apiResponse.usageMetadata
            const pricing = languageModelConfig.pricing
            if (typeof pricing.input === 'object') {
                if ('audio' in pricing.input) {
                    const { input, output: outputCost } = pricing as CategorizedLanguageModelPricing
                    cost += calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
    
                    promptTokensDetails.forEach((detail) => {
                        const inputCost = detail.modality === 'AUDIO' ? input.audio : input.default
                        cost += calculateTokensCost(detail.tokenCount, inputCost)
                    })
                }
                else {
                    const { input, output, promptThreshold } = pricing as TieredLanguageModelPricing
    
                    const isUnderThreshold = promptTokenCount <= promptThreshold
                    const inputCost = isUnderThreshold ? input.underThresholdRate : input.overThresholdRate
                    const outputCost = isUnderThreshold ? output.underThresholdRate : output.overThresholdRate
                    cost += calculateTokensCost(promptTokenCount, inputCost) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
                }
            }
            else {
                const { input: inputCost, output: outputCost } = pricing as FlatLanguageModelPricing
                cost += calculateTokensCost(promptTokenCount, inputCost) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
            }

            const webSearchCost = languageModelConfig.webSearchCost ?? 0
            const webSearchCalls = apiResponse.candidates.some(candidate => candidate.groundingMetadata?.webSearchQueries?.length ?? 0 > 0) ? 1 : 0
            cost += calculateWebSearchCost(webSearchCalls, webSearchCost)

            return {
                cost,
                model,
            }
        }

        let videoOperationId
        if (videoModelConfig && request.url.includes(':predictLongRunning') && 'name' in apiResponse) {
            const VEO_VIDEO_DURATION_SECONDS = 8
            const { name } = apiResponse // models/veo-2.0-generate-001/operations/hnp64qpr7tj2\
            cost = videoModelConfig.pricing.costPerSecond * VEO_VIDEO_DURATION_SECONDS   
            videoOperationId = name.split('/').pop()
        }

        return {
            cost,
            model,
            metadata: {
                videoOperationId,
            },
        }
    },

    isStreaming: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        const url = request.url
        return url.includes(':streamGenerateContent')
    },

    isNonUsageRequest: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        return request.url.includes('/operations/') || request.url.includes('/files/')
    },

    validateRequest: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): void => {
        if (request.url.includes(':predictLongRunning')) {
            const sampleCount = (request.body as { parameters?: { sampleCount?: number } }).parameters?.sampleCount
            if (!sampleCount || sampleCount > 1) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'Only one video can be generated at a time, make sure to set sampleCount to 1.',
                    },
                })
            }
        }
    },
} 