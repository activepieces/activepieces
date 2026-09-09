import { isNil, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils'
import { BaseAIProviderAuthConfig, CloudflareGatewayProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/core-piece-types'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { ImageModel, LanguageModel } from 'ai'
import { createAiGateway } from 'ai-gateway-provider'

export function createCloudflareGatewayModel(params: CreateCloudflareGatewayModelParams & { isImage: true }): ImageModel
export function createCloudflareGatewayModel(params: CreateCloudflareGatewayModelParams & { isImage?: false }): LanguageModel
export function createCloudflareGatewayModel({ auth, config, modelId, isImage = false, openaiResponsesModel = false, routing = 'compat', metadata, onOutcome }: CreateCloudflareGatewayModelParams): ImageModel | LanguageModel {
    const { apiKey } = auth as BaseAIProviderAuthConfig
    const { accountId, gatewayId, vertexProject, vertexRegion } = config as CloudflareGatewayProviderConfig
    const { provider: providerPrefix, model: actualModelId, publisher } = splitCloudflareGatewayModelId(modelId)
    const headers = {
        'cf-aig-authorization': `Bearer ${apiKey}`,
        ...(isNil(metadata) ? {} : { 'cf-aig-metadata': JSON.stringify(metadata) }),
    }

    if (routing === 'compat') {
        return compatGatewayModel({ accountId, gatewayId, headers, isImage, modelId: actualModelId, onOutcome })
    }

    const aigateway = createAiGateway({ accountId, gateway: gatewayId, apiKey })
    switch (providerPrefix) {
        case 'anthropic':
            return aigateway(createAnthropic({ apiKey: CF_TEMP_TOKEN, headers })(actualModelId))
        case 'google-ai-studio':
            return aigateway(createGoogleGenerativeAI({ apiKey: CF_TEMP_TOKEN, headers })(actualModelId))
        case 'google-vertex-ai': {
            if (isNil(vertexProject) || isNil(vertexRegion) || isNil(publisher)) {
                return compatGatewayModel({ accountId, gatewayId, headers, isImage, modelId })
            }
            return createGoogleGenerativeAI({
                apiKey,
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-vertex-ai/v1/projects/${vertexProject}/locations/${vertexRegion}/publishers/${publisher}/`,
                headers,
            })(actualModelId)
        }
        case 'openai': {
            const openaiProvider = createOpenAI({
                apiKey: NO_KEY_PLACEHOLDER,
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
                headers,
                fetch: stripAuthorizationHeader,
            })
            if (isImage) {
                return openaiProvider.imageModel(actualModelId)
            }
            return openaiResponsesModel ? openaiProvider.responses(actualModelId) : openaiProvider.chat(actualModelId)
        }
        default:
            return compatGatewayModel({ accountId, gatewayId, headers, isImage, modelId })
    }
}

function compatGatewayModel({ accountId, gatewayId, headers, isImage, modelId, onOutcome }: {
    accountId: string
    gatewayId: string
    headers: Record<string, string>
    isImage: boolean
    modelId: string
    onOutcome?: ProviderOutcomeReporter
}): ImageModel | LanguageModel {
    const provider = createOpenAICompatible({
        name: 'cloudflare',
        baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
        headers,
        ...spreadIfDefined('fetch', observedProviderFetch(onOutcome)),
    })
    return isImage ? provider.imageModel(modelId) : provider.chatModel(modelId)
}

const stripAuthorizationHeader: typeof globalThis.fetch = (input, init) => {
    const headers = new Headers(init?.headers)
    headers.delete('Authorization')
    return fetch(input, { ...init, headers })
}

const NO_KEY_PLACEHOLDER = 'no-key'
const CF_TEMP_TOKEN = 'CF_TEMP_TOKEN'

export type CloudflareGatewayRouting = 'compat' | 'submodel'

export type CloudflareGatewayMetadata = {
    projectId: string
    flowId: string
    runId: string
}

export type CreateCloudflareGatewayModelParams = {
    auth: Record<string, unknown>
    config: Record<string, unknown>
    modelId: string
    isImage?: boolean
    openaiResponsesModel?: boolean
    routing?: CloudflareGatewayRouting
    metadata?: CloudflareGatewayMetadata
    onOutcome?: ProviderOutcomeReporter
}
