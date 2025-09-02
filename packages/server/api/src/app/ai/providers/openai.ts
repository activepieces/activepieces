import { AIProvider, DALLE2PricingPerImage, DALLE3PricingPerImage, FlatLanguageModelPricing, GPTImage1PricingPerImage  } from '@activepieces/common-ai'
import { ActivepiecesError, ErrorCode,  isNil } from '@activepieces/shared'
import { createParser } from 'eventsource-parser'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, StreamingParser, Usage } from './types'
import { calculateTokensCost, calculateWebSearchCost, getProviderConfig } from './utils'

export const openaiProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>
        return body.model
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const body = request.body as { size: string, model: string, n?: string, quality?: string }
        const apiResponse = response as {
            tools: { type: string }[]
            usage: 
            | { 
                input_tokens: number
                output_tokens: number
                input_tokens_details: { text_tokens: number, image_tokens: number }
            }
            | { prompt_tokens: number, completion_tokens: number }
        } 
        const { provider } = request.params as { provider: string }

        if (openaiProvider.isNonUsageRequest?.(request)) {
            return {
                cost: 0,
                model: body.model,
            }
        }

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
            let webSearchCalls = 0
            if ('prompt_tokens' in apiResponse.usage) {
                inputTokens = apiResponse.usage.prompt_tokens
                outputTokens = apiResponse.usage.completion_tokens
            }
            else {
                inputTokens = apiResponse.usage.input_tokens
                outputTokens = apiResponse.usage.output_tokens
                if (apiResponse.tools.length > 0) {
                    webSearchCalls = apiResponse.tools.filter((tool) => tool.type === 'web_search_preview' || tool.type === 'web_search_preview_2025_03_11').length
                }
            }

            const { input: inputCost, output: outputCost } = languageModelConfig.pricing as FlatLanguageModelPricing
            const webSearchCost = languageModelConfig.webSearchCost ?? 0
            return {
                cost: calculateTokensCost(inputTokens, inputCost) + calculateTokensCost(outputTokens, outputCost) + calculateWebSearchCost(webSearchCalls, webSearchCost),
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

        if (imageModelConfig?.instance.modelId === 'gpt-image-1') {
            const pricing = imageModelConfig.pricing as GPTImage1PricingPerImage
            const { input_tokens_details } = apiResponse.usage as { input_tokens_details: { text_tokens: number, image_tokens: number } }
            const { output_tokens } = apiResponse.usage as { output_tokens: number }
            const imageInputCost = pricing.input.image
            const textInputCost = pricing.input.text
            const outputCost = pricing.output
            return {
                cost: calculateTokensCost(input_tokens_details.image_tokens, imageInputCost) + calculateTokensCost(input_tokens_details.text_tokens, textInputCost) + calculateTokensCost(output_tokens, outputCost),
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

    getAuthHeaders: (config: AIProvider['config']): Record<string, string> => {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${config.apiKey}`,
        }
        if (config.azureOpenAI) {
            headers['api-key'] = config.apiKey
        }
        return headers
    },

    getBaseUrl: (config: AIProvider['config']): string => {
        if (config.azureOpenAI) {
            return `https://${config.azureOpenAI.resourceName}.openai.azure.com`
        }
        return 'https://api.openai.com'
    },

    rewriteUrl: (config: AIProvider['config'], originalUrl: string): string => {
        if (config.azureOpenAI) {
            return originalUrl.replace('openai/v1/', 'openai/openai/v1/') + '?api-version=preview'
        }
        return originalUrl
    },

    isNonUsageRequest: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        return request.url.includes('/moderations') && (request.body as { model: string }).model === 'omni-moderation-latest'
    },
}
