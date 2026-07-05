import { isNil } from '@activepieces/core-utils'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, CLOUDFLARE_GATEWAY_MODEL_METADATA, CloudflareGatewayModelFilter, CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/shared'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const cloudflareGatewayProvider: AIProviderStrategy<CloudflareGatewayProviderAuthConfig, CloudflareGatewayProviderConfig> = {
    name: 'Cloudflare Gateway',
    async validateConnection(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log: FastifyBaseLogger): Promise<void> {

        const textModels = config.models.filter(m => m.modelType === AIProviderModelType.TEXT)
        const invalidModels: string[] = []
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
    async listModels(_: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
    async discoverModels(authConfig: CloudflareGatewayProviderAuthConfig, config: CloudflareGatewayProviderConfig, log: FastifyBaseLogger): Promise<AIProviderModel[]> {
        const discovery = config.discovery
        if (isNil(discovery)) {
            throw new Error('config.discovery.provider must be set (openai | anthropic | google-vertex-ai) to discover models')
        }
        const rawModels = await fetchUpstreamModels({ authConfig, config, discovery, log })
        return applyModelFilter(rawModels, discovery.filter, discovery.provider)
    },
}

async function fetchUpstreamModels({
    authConfig,
    config,
    discovery,
    log,
}: {
    authConfig: CloudflareGatewayProviderAuthConfig
    config: CloudflareGatewayProviderConfig
    discovery: NonNullable<CloudflareGatewayProviderConfig['discovery']>
    log: FastifyBaseLogger
}): Promise<AIProviderModel[]> {
    const baseUrl = `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}`
    const gatewayHeaders = { 'cf-aig-authorization': `Bearer ${authConfig.apiKey}` }

    switch (discovery.provider) {
        case 'openai': {
            const res = await httpClient.sendRequest<{ data: { id: string }[] }>({
                url: `${baseUrl}/openai/models`,
                method: HttpMethod.GET,
                headers: gatewayHeaders,
            })
            return res.body.data.map(m => ({
                id: `openai/${m.id}`,
                name: m.id,
                type: AIProviderModelType.TEXT,
            }))
        }
        case 'anthropic': {
            const models: AIProviderModel[] = []
            let afterId: string | undefined
            let hasMore = true
            let pageCount = 0
            const MAX_PAGES = 10
            while (hasMore && pageCount < MAX_PAGES) {
                pageCount++
                const res = await httpClient.sendRequest<{ data: { id: string, display_name: string }[], has_more: boolean, last_id: string }>({
                    url: `${baseUrl}/anthropic/v1/models${afterId ? `?after_id=${afterId}` : ''}`,
                    method: HttpMethod.GET,
                    headers: { ...gatewayHeaders, 'anthropic-version': '2023-06-01' },
                })
                models.push(...res.body.data.map(m => ({
                    id: `anthropic/${m.id}`,
                    name: m.display_name ?? m.id,
                    type: AIProviderModelType.TEXT,
                })))
                hasMore = res.body.has_more
                const nextAfterId = res.body.last_id
                if (hasMore && (!nextAfterId || nextAfterId === afterId)) {
                    throw new Error('Anthropic model discovery pagination stalled: gateway returned has_more without an advancing cursor')
                }
                afterId = nextAfterId
            }
            if (pageCount >= MAX_PAGES) {
                log.warn({ modelCount: models.length }, '[cloudflareGatewayProvider#discoverModels] Anthropic pagination hit max pages, some models may be omitted')
            }
            return models
        }
        case 'google-vertex-ai': {
            const publisher = discovery.vertexPublisher ?? 'google'
            try {
                const res = await httpClient.sendRequest<{ publisherModels?: { name: string }[], models?: { name: string }[] }>({
                    url: `${baseUrl}/google-vertex-ai/v1/publishers/${publisher}/models`,
                    method: HttpMethod.GET,
                    headers: gatewayHeaders,
                })
                const entries = res.body.publisherModels ?? res.body.models ?? []
                return entries.map(m => {
                    const modelId = m.name.split('/').pop() ?? m.name
                    return {
                        id: `google-vertex-ai/${publisher}/${modelId}`,
                        name: modelId,
                        type: AIProviderModelType.TEXT,
                    }
                })
            }
            catch (error) {
                log.error({ error }, '[cloudflareGatewayProvider#discoverModels] Vertex catalog discovery failed')
                throw new Error('Could not list Google Vertex AI models through the gateway. Add models manually, or verify your gateway/BYOK Vertex configuration.')
            }
        }
    }
}

function applyModelFilter(models: AIProviderModel[], filter: CloudflareGatewayModelFilter | undefined, _gatewayProvider: string): AIProviderModel[] {
    if (isNil(filter)) {
        return models
    }
    let result = models
    if (filter.search) {
        const q = filter.search.toLowerCase()
        result = result.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    }
    if (filter.vendors && filter.vendors.length > 0) {
        result = result.filter(m => {
            const meta = CLOUDFLARE_GATEWAY_MODEL_METADATA[m.id]
            return !isNil(meta) && filter.vendors!.includes(meta.vendor)
        })
    }
    if (filter.zdrOnly) {
        result = result.filter(m => CLOUDFLARE_GATEWAY_MODEL_METADATA[m.id]?.zdrEligible === true)
    }
    return result
}
