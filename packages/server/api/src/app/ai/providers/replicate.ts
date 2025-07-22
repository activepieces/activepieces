import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { AIProviderStrategy, Usage } from './types'
import { getProviderConfig } from './utils'

export const replicateProvider: AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null => {
        const body = request.body as Record<string, string>

        if (body.version) {
            // e.g. replicate/hello-world:5c7d5dc6
            const version = body.version.split(':')[1]
            return getProviderConfig('replicate')?.imageModels.find((m) => m.instance.modelId.split(':')[1] === version)?.instance.modelId ?? null
        }
        else {
            // Extract model from URL pattern: /v1/models/{owner}/{model-name}/predictions
            const urlMatch = request.url.match(/\/v1\/models\/([^/]+\/[^/]+)/)
            return urlMatch?.[1] ?? null
        }
    },

    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage => {
        const apiResponse = response as { model: string }
        const body = request.body as { input: { num_outputs?: string } }
        const { provider } = request.params as { provider: string }

        const providerConfig = getProviderConfig(provider)!
        const imageCount = parseInt(body.input.num_outputs as string ?? '1')
        const model = apiResponse.model

        const imageModelConfig = providerConfig.imageModels.find((m) => m.instance.modelId.split(':')[0] === model)
        if (!imageModelConfig) {
            throw new ActivepiecesError({
                code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                params: {
                    provider,
                    model,
                },
            })
        }

        return {
            cost: imageModelConfig.pricing as number * imageCount,
            model,
        }
    },

    isStreaming: (_request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean => {
        return false
    },
} 