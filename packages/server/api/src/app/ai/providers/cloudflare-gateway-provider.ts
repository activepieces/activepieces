import { isNil } from '@activepieces/core-utils'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/shared'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'
export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log: FastifyBaseLogger): Promise<void> {

        const invalidModels: string[] = []
        if (config.modelDiscovery?.enabled) {
            try {
                await discoverCloudflareGatewayModels(authConfig, config, {
                    log,
                    throwOnError: true,
                })
            }
            catch (error: unknown) {
                log.error({ error }, '[cloudflareGatewayProvider#validateConnection] Failed to discover models')
                invalidModels.push('model discovery')
            }
        }

        const configuredModels = config.models ?? []
        const textModels = configuredModels.filter(m => m.modelType === AIProviderModelType.TEXT)
        for (const model of textModels) {
            try {
                const { provider: providerPrefix, model: actualModelId, publisher } = splitCloudflareGatewayModelId(model.modelId)
                if (providerPrefix === 'google-vertex-ai') {
                    if (isNil(config.vertexProject) || isNil(config.vertexRegion)) {
                        throw new Error('Google Vertex ai project and region are required for Google Vertex AI models')
                    }
                    if (isNil(publisher)) {
                        throw new Error('Google Vertex ai publisher is required for Google Vertex AI models')
                    }
                    const providerConstructor = createGoogleGenerativeAI({
                        apiKey: authConfig.apiKey,
                        baseURL: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/google-vertex-ai/v1/projects/${config.vertexProject}/locations/${config.vertexRegion}/publishers/${publisher}/`,
                        headers: {
                            'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                        },
                    })
                    const aiModel = providerConstructor(actualModelId)
                    await generateText({
                        model: aiModel,
                        messages: [{ role: 'user', content: 'Hi, reply only with "ok"' }],
                        maxOutputTokens: 1,
                    })
                }
                else {
                    await httpClient.sendRequest({
                        url: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`,
                        method: HttpMethod.POST,
                        headers: {
                            'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: {
                            model: model.modelId,
                            messages: [{ role: 'user', content: 'Hi, reply only with "ok"' }],
                        },
                    })
                }
            }
            catch (error: unknown) {
                log.error({ error }, '[cloudflareGatewayProvider#validateConnection] Failed to validate model')
                invalidModels.push(model.modelId)
            }
        }
               
        
       

        if (invalidModels.length > 0) {
            throw new Error(
                `These models have issues: ${invalidModels.join(', ')}, make sure the model id is correct and in the{provider_name}/{model_name} format, also check that the other inputs are correct.`,
            )
        }
    },
    async listModels(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log?: FastifyBaseLogger): Promise<AIProviderModel[]> {
        const manualModels = (config.models ?? []).map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))

        if (config.modelDiscovery?.enabled !== true) {
            return manualModels
        }

        try {
            const discoveredModels = await discoverCloudflareGatewayModels(authConfig, config, {
                log,
                throwOnError: false,
            })
            return dedupeModels([...manualModels, ...discoveredModels])
        }
        catch (error: unknown) {
            log?.warn({ error }, '[cloudflareGatewayProvider#listModels] Failed to discover models, returning manual models')
            return manualModels
        }
    },
}

async function discoverCloudflareGatewayModels(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, options: DiscoveryOptions = {}): Promise<AIProviderModel[]> {
    const discovery = config.modelDiscovery
    if (isNil(discovery) || discovery.enabled !== true || isNil(discovery.providers) || discovery.providers.length === 0) {
        return []
    }

    const providers = discovery.providers
    const results = await Promise.allSettled(providers.map(provider => discoverProviderModels({
        authConfig,
        config,
        provider,
        options,
    })))
    const rejectedProviders = results
        .map((result, index) => ({ result, provider: providers[index] }))
        .filter((entry): entry is RejectedProviderDiscoveryResult => entry.result.status === 'rejected' && !isNil(entry.provider))

    if (rejectedProviders.length > 0) {
        options.log?.warn({
            providers: rejectedProviders.map(entry => entry.provider),
            errors: rejectedProviders.map(entry => entry.result.reason),
        }, '[cloudflareGatewayProvider#discoverCloudflareGatewayModels] Failed to discover models for some providers')
        if (options.throwOnError === true) {
            throw new Error(`Failed to discover models for providers: ${rejectedProviders.map(entry => entry.provider).join(', ')}`)
        }
    }

    return dedupeModels(results
        .filter((result): result is PromiseFulfilledResult<AIProviderModel[]> => result.status === 'fulfilled')
        .flatMap(result => result.value))
}

async function discoverProviderModels({ authConfig, config, provider, options }: DiscoverProviderModelsParams): Promise<AIProviderModel[]> {
    if (provider === 'google-vertex-ai') {
        return discoverGoogleVertexAiModels({ authConfig, config, options })
    }

    const response = await sendCloudflareGatewayRequest<ProviderModelListResponse>({
        authConfig,
        config,
        path: getModelListPath(provider),
    })

    return extractProviderModels(response.body, provider, undefined, config.modelDiscovery?.filter)
}

async function discoverGoogleVertexAiModels({ authConfig, config, options }: Omit<DiscoverProviderModelsParams, 'provider'>): Promise<AIProviderModel[]> {
    if (isNil(config.vertexProject) || isNil(config.vertexRegion)) {
        throw new Error('Google Vertex ai project and region are required to discover Google Vertex AI models')
    }

    const publishers = config.modelDiscovery?.vertexPublishers?.filter(publisher => publisher.trim().length > 0) ?? ['google']
    const results = await Promise.allSettled(publishers.map(async publisher => {
        const response = await sendCloudflareGatewayRequest<ProviderModelListResponse>({
            authConfig,
            config,
            path: `google-vertex-ai/v1/projects/${config.vertexProject}/locations/${config.vertexRegion}/publishers/${publisher}/models`,
        })
        return extractProviderModels(response.body, 'google-vertex-ai', publisher, config.modelDiscovery?.filter)
    }))
    const rejectedPublishers = results
        .map((result, index) => ({ result, publisher: publishers[index] }))
        .filter((entry): entry is RejectedPublisherDiscoveryResult => entry.result.status === 'rejected' && !isNil(entry.publisher))

    if (rejectedPublishers.length > 0) {
        options.log?.warn({
            publishers: rejectedPublishers.map(entry => entry.publisher),
            errors: rejectedPublishers.map(entry => entry.result.reason),
        }, '[cloudflareGatewayProvider#discoverGoogleVertexAiModels] Failed to discover models for some Google Vertex AI publishers')
    }

    if (rejectedPublishers.length === publishers.length || (options.throwOnError === true && rejectedPublishers.length > 0)) {
        throw new Error(`Failed to discover Google Vertex AI models for publishers: ${rejectedPublishers.map(entry => entry.publisher).join(', ')}`)
    }

    return results
        .filter((result): result is PromiseFulfilledResult<AIProviderModel[]> => result.status === 'fulfilled')
        .flatMap(result => result.value)
}

async function sendCloudflareGatewayRequest<T>({ authConfig, config, path }: SendCloudflareGatewayRequestParams): Promise<{ body: T }> {
    return httpClient.sendRequest<T>({
        url: `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/${path}`,
        method: HttpMethod.GET,
        headers: {
            'cf-aig-authorization': `Bearer ${authConfig.apiKey}`,
            'Content-Type': 'application/json',
        },
    })
}

function getModelListPath(provider: string): string {
    const providerModelPaths: Record<string, string> = {
        anthropic: 'anthropic/v1/models',
        'google-ai-studio': 'google-ai-studio/v1beta/models',
        openai: 'openai/models',
        openrouter: 'openrouter/api/v1/models',
    }

    return providerModelPaths[provider] ?? `${provider}/models`
}

function extractProviderModels(response: ProviderModelListResponse, provider: string, publisher?: string, filter?: string): AIProviderModel[] {
    const values = getModelEntries(response)

    return values.map(model => {
        const id = getModelId(model)
        if (isNil(id)) {
            return undefined
        }

        const normalizedId = normalizeModelId({ id, provider, publisher })
        const aiModel = {
            id: normalizedId,
            name: getModelName(model) ?? normalizedId,
            type: inferModelType(normalizedId),
        }
        if (!matchesDiscoveryFilter(aiModel, model, filter)) {
            return undefined
        }
        return aiModel
    }).filter((model): model is AIProviderModel => !isNil(model))
}

function getModelEntries(response: ProviderModelListResponse): ModelEntry[] {
    if (Array.isArray(response)) {
        return response
    }
    if (!isNil(response.data) && Array.isArray(response.data)) {
        return response.data
    }
    if (!isNil(response.models) && Array.isArray(response.models)) {
        return response.models
    }
    return []
}

function getModelId(model: ModelEntry): string | undefined {
    if (typeof model === 'string') {
        return model
    }
    const id = model.id ?? model.name ?? model.model ?? model.modelId
    if (id === undefined) {
        return undefined
    }
    const parts = id.split('/')
    return parts[parts.length - 1] ?? id
}

function getModelName(model: ModelEntry): string | undefined {
    if (typeof model === 'string') {
        return model
    }
    return model.display_name ?? model.displayName ?? model.name ?? model.id ?? model.model ?? model.modelId
}

function normalizeModelId({ id, provider, publisher }: NormalizeModelIdParams): string {
    if (provider === 'google-vertex-ai') {
        return `${provider}/${publisher ?? 'google'}/${id}`
    }
    if (id.startsWith(`${provider}/`)) {
        return id
    }
    return `${provider}/${id}`
}

function inferModelType(modelId: string): AIProviderModelType {
    const imageModelHints = ['dall-e', 'gpt-image', 'imagen', 'image', 'stable-diffusion', 'flux']
    return imageModelHints.some(hint => modelId.toLowerCase().includes(hint))
        ? AIProviderModelType.IMAGE
        : AIProviderModelType.TEXT
}

function matchesDiscoveryFilter(model: AIProviderModel, source: ModelEntry, filter?: string): boolean {
    const normalizedFilter = filter?.trim()
    if (normalizedFilter === undefined || normalizedFilter.length === 0) {
        return true
    }

    const filters = normalizedFilter.split(',').map(part => part.trim().toLowerCase()).filter(part => part.length > 0)
    if (filters.length === 0) {
        return true
    }

    const searchableText = `${model.id} ${model.name} ${JSON.stringify(source)}`.toLowerCase()
    return filters.some(filter => searchableText.includes(filter))
}

function dedupeModels(models: AIProviderModel[]): AIProviderModel[] {
    const seen = new Set<string>()
    return models.filter(model => {
        if (seen.has(model.id)) {
            return false
        }
        seen.add(model.id)
        return true
    })
}

type DiscoverProviderModelsParams = {
    authConfig: CloudflareGatewayProviderAuthConfig
    config: CloudflareGatewayProviderConfig
    provider: string
    options: DiscoveryOptions
}

type DiscoveryOptions = {
    log?: FastifyBaseLogger
    throwOnError?: boolean
}

type RejectedProviderDiscoveryResult = {
    result: PromiseRejectedResult
    provider: string
}

type RejectedPublisherDiscoveryResult = {
    result: PromiseRejectedResult
    publisher: string
}

type SendCloudflareGatewayRequestParams = {
    authConfig: CloudflareGatewayProviderAuthConfig
    config: CloudflareGatewayProviderConfig
    path: string
}

type NormalizeModelIdParams = {
    id: string
    provider: string
    publisher: string | undefined
}

type ModelEntry = string | {
    id?: string
    name?: string
    model?: string
    modelId?: string
    display_name?: string
    displayName?: string
}

type ProviderModelListResponse = ModelEntry[] | {
    data?: ModelEntry[]
    models?: ModelEntry[]
}
