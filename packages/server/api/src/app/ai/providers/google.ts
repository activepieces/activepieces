import { AIProvider } from '@activepieces/common-ai'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { createParser } from 'eventsource-parser'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, StreamingParser, Usage } from './types'
import { calculateTokensCost, calculateWebSearchCost, getProviderConfig } from './utils'
export const googleProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        // https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent
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
        const imageModelConfig = providerConfig.imageModels.find((m) => m.instance.modelId === model)
        let cost = 0
 
        if ('usageMetadata' in apiResponse) {
            const { promptTokenCount, candidatesTokenCount, promptTokensDetails, thoughtsTokenCount } = apiResponse.usageMetadata
            if (languageModelConfig) {
                switch (languageModelConfig.pricing.type) {
                    case 'categorized':
                    {
                        const { input, output: outputCost } = languageModelConfig.pricing
                        cost += calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
        
                        promptTokensDetails.forEach((detail) => {
                            const inputCost = detail.modality === 'AUDIO' ? input.audio : input.default
                            cost += calculateTokensCost(detail.tokenCount, inputCost)
                        })
                        break
                    }
                    case 'tiered':{
                        const { input, output, promptThreshold } = languageModelConfig.pricing
        
                        const isUnderThreshold = promptTokenCount <= promptThreshold
                        const inputCost = isUnderThreshold ? input.underThresholdRate : input.overThresholdRate
                        const outputCost = isUnderThreshold ? output.underThresholdRate : output.overThresholdRate
                        cost += calculateTokensCost(promptTokenCount, inputCost) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), outputCost)
                        break
                    }
                    case 'flat':
                    {
                        
                        cost += calculateTokensCost(promptTokenCount, languageModelConfig.pricing.input) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), languageModelConfig.pricing.output)

                    }
                }
    
                const webSearchCost = languageModelConfig.webSearchCost ?? 0
                const webSearchCalls = apiResponse.candidates.some(candidate => candidate.groundingMetadata?.webSearchQueries?.length ?? 0 > 0) ? 1 : 0
                cost += calculateWebSearchCost(webSearchCalls, webSearchCost)
    
                return {
                    cost,
                    model,
                }
            }
            if (imageModelConfig) {
                if (typeof imageModelConfig.pricing !== 'number' && imageModelConfig.pricing.type === 'GPTImage1') {
                    cost += calculateTokensCost(promptTokenCount, imageModelConfig.pricing.input.image) + calculateTokensCost(candidatesTokenCount + (thoughtsTokenCount ?? 0), imageModelConfig.pricing.output)
                }
                else throw new ActivepiecesError({
                    code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                    params: {
                        provider,
                        model,
                    },
                })
            }
        }
      

        let videoOperationId
        if (videoModelConfig && request.url.includes(':predictLongRunning') && 'name' in apiResponse) {
            const { name } = apiResponse // models/veo-2.0-generate-001/operations/hnp64qpr7tj2\
            cost = videoModelConfig.pricing.costPerSecond * videoModelConfig.minimumDurationInSeconds   
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
        // Check if the URL contains :streamGenerateContent endpoint or alt=sse parameter
        return request.url.includes(':streamGenerateContent') || request.url.includes('alt=sse')
    },

    streamingParser: (): StreamingParser => {
        let finalResponse: Record<string, unknown> = {}
        let accumulatedUsage: {
            promptTokenCount: number
            candidatesTokenCount: number
            thoughtsTokenCount?: number
            promptTokensDetails: Array<{ modality: string, tokenCount: number }>
        } | null = null
        
        const parser = createParser({
            onEvent(event) {
                if (event.data.trim() === '' || !event.data) {
                    return
                }

                try {
                    const data = JSON.parse(event.data)
                    // Accumulate usage from each chunk
                    if (data.usageMetadata) {
                        if (!accumulatedUsage) {
                            accumulatedUsage = {
                                promptTokenCount: 0,
                                candidatesTokenCount: 0,
                                thoughtsTokenCount: 0,
                                promptTokensDetails: []
                            }
                        }
                        accumulatedUsage.promptTokenCount += data.usageMetadata.promptTokenCount || 0
                        accumulatedUsage.candidatesTokenCount += data.usageMetadata.candidatesTokenCount || 0
                        accumulatedUsage.thoughtsTokenCount = (accumulatedUsage.thoughtsTokenCount || 0) + (data.usageMetadata.thoughtsTokenCount || 0)
                        if (data.usageMetadata.promptTokensDetails) {
                            accumulatedUsage.promptTokensDetails.push(...(data.usageMetadata.promptTokensDetails || []))
                        }
                    }
                    
                    // Keep the final chunk as the complete response
                    if (data.candidates || data.usageMetadata) {
                        finalResponse = data
                    }
                } catch (e) {
                    // Ignore parse errors for individual chunks
                }
            },
        })
        
        return {
            onChunk: (chunk: string): void => {
                parser.feed(chunk)
            },
            onEnd: () => {
                // Merge accumulated usage into final response
                if (accumulatedUsage && finalResponse) {
                    finalResponse.usageMetadata = {
                        promptTokenCount: accumulatedUsage.promptTokenCount,
                        candidatesTokenCount: accumulatedUsage.candidatesTokenCount,
                        thoughtsTokenCount: accumulatedUsage.thoughtsTokenCount,
                        promptTokensDetails: accumulatedUsage.promptTokensDetails
                    }
                }
                return finalResponse
            },
        }
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


