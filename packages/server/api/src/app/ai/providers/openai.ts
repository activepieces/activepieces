import { ActivepiecesError, DALLE2PricingPerImage, DALLE3PricingPerImage, ErrorCode, FlatLanguageModelPricing, isNil } from '@activepieces/shared'
import { createParser } from 'eventsource-parser'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, StreamingParser, Usage } from './types'
import { calculateTokensCost, getProviderConfig } from './utils'

export const openaiProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>
        return body.model
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const body = request.body as { size: string, n?: string, quality?: string }
        const apiResponse = response as {
            usage: 
            | { input_tokens: number, output_tokens: number }
            | { prompt_tokens: number, completion_tokens: number }
        } 
        const { provider } = request.params as { provider: string }

        const providerConfig = getProviderConfig(provider)!
        const model = openaiProvider.extractModelId(request)!
        const size = body.size
        const imageCount = parseInt(body.n ?? '1')
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

            const { input: inputCost, output: outputCost } = languageModelConfig.pricing as FlatLanguageModelPricing
            return {
                cost: calculateTokensCost(inputTokens, inputCost) + calculateTokensCost(outputTokens, outputCost),
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

    isStreaming: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        const body = request.body as { stream?: boolean }
        const isStreaming = body.stream ?? false

        if (isStreaming) {
            if (!request.url.includes('chat/completions')) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_REQUEST_NOT_SUPPORTED,
                    params: {
                        message: 'OpenAI streaming is only supported for chat/completions API',
                    },
                })
            }

            (request.body as Record<string, unknown>)['stream_options'] = {
                include_usage: true,
            }
        }

        return isStreaming
    },

    streamingParser: (): StreamingParser => {
        let response: Record<string, unknown> = {}
        const parser = createParser({
            onEvent(event) {
                if (event.data === '[DONE]' || event.data.trim() === '') {
                    return
                }

                const data = JSON.parse(event.data)
                if (!isNil(data.usage)) {
                    response = data
                }
            },
        })
        return {
            onChunk: (chunk: string): void => {
                parser.feed(chunk)
            },
            onEnd: () => response,
        }
    },
} 