import { AIProviderName } from '@activepieces/core-utils'
import * as z from 'zod/mini'

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const BaseAIProviderAuthConfig = z.object({
    apiKey: z.string(),
})
export type BaseAIProviderAuthConfig = z.infer<typeof BaseAIProviderAuthConfig>

const AnthropicProviderAuthConfig = BaseAIProviderAuthConfig
const ActivePiecesProviderAuthConfig = z.object({
    apiKey: z.string(),
    apiKeyHash: z.string(),
})
const OpenAICompatibleProviderAuthConfig = BaseAIProviderAuthConfig
const CloudflareGatewayProviderAuthConfig = BaseAIProviderAuthConfig
const AzureProviderAuthConfig = BaseAIProviderAuthConfig
const GoogleProviderAuthConfig = BaseAIProviderAuthConfig
const OpenAIProviderAuthConfig = BaseAIProviderAuthConfig
const OpenRouterProviderAuthConfig = BaseAIProviderAuthConfig
const MistralProviderAuthConfig = BaseAIProviderAuthConfig

export const BedrockProviderAuthConfig = z.object({
    accessKeyId: z.string().check(z.minLength(1)),
    secretAccessKey: z.string().check(z.minLength(1)),
})
export type BedrockProviderAuthConfig = z.infer<typeof BedrockProviderAuthConfig>

const AnthropicProviderConfig = z.object({})
const ActivePiecesProviderConfig = z.object({})
const GoogleProviderConfig = z.object({})
const OpenAIProviderConfig = z.object({})
const OpenRouterProviderConfig = z.object({})
const MistralProviderConfig = z.object({})

export const ProviderModelConfig = z.object({
    modelId: z.string(),
    modelName: z.string(),
    modelType: z.enum(AIProviderModelType),
})
export type ProviderModelConfig = z.infer<typeof ProviderModelConfig>

export const OpenAICompatibleProviderConfig = z.object({
    apiKeyHeader: z.string(),
    baseUrl: z.string(),
    models: z.array(ProviderModelConfig),
    defaultHeaders: z.optional(z.record(z.string(), z.string())),
})
export type OpenAICompatibleProviderConfig = z.infer<typeof OpenAICompatibleProviderConfig>

export const CloudflareGatewayModelDiscoveryConfig = z.object({
    enabled: z.optional(z.boolean()),
    providers: z.optional(z.array(z.string())),
    filter: z.optional(z.string()),
    vertexPublishers: z.optional(z.array(z.string())),
})
export type CloudflareGatewayModelDiscoveryConfig = z.infer<typeof CloudflareGatewayModelDiscoveryConfig>

export const CloudflareGatewayProviderConfig = z.object({
    accountId: z.string(),
    gatewayId: z.string(),
    models: z.optional(z.array(ProviderModelConfig)),
    vertexProject: z.optional(z.string()),
    vertexRegion: z.optional(z.string()),
    modelDiscovery: z.optional(CloudflareGatewayModelDiscoveryConfig),
})
export type CloudflareGatewayProviderConfig = z.infer<typeof CloudflareGatewayProviderConfig>

export const AzureProviderConfig = z.object({
    resourceName: z.string(),
    apiVersion: z.pipe(
        z.transform((v) => (typeof v === 'string' && v.trim().length === 0 ? undefined : v)),
        z.optional(z.string()),
    ),
})
export type AzureProviderConfig = z.infer<typeof AzureProviderConfig>

export const BedrockProviderConfig = z.object({
    region: z.string().check(z.minLength(1)),
})
export type BedrockProviderConfig = z.infer<typeof BedrockProviderConfig>

export const AIProviderAuthConfig = z.union([
    AnthropicProviderAuthConfig,
    AzureProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
    OpenRouterProviderAuthConfig,
    CloudflareGatewayProviderAuthConfig,
    OpenAICompatibleProviderAuthConfig,
    ActivePiecesProviderAuthConfig,
    BedrockProviderAuthConfig,
    MistralProviderAuthConfig,
])
export type AIProviderAuthConfig = z.infer<typeof AIProviderAuthConfig>

// Order matters, put schemas with required fields first, empty ones last. This is to avoid empty objects matching any object.
export const AIProviderConfig = z.union([
    OpenAICompatibleProviderConfig,
    CloudflareGatewayProviderConfig,
    AzureProviderConfig,
    BedrockProviderConfig,
    AnthropicProviderConfig,
    GoogleProviderConfig,
    OpenAIProviderConfig,
    OpenRouterProviderConfig,
    ActivePiecesProviderConfig,
    MistralProviderConfig,
])
export type AIProviderConfig = z.infer<typeof AIProviderConfig>

export const AIProviderModel = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(AIProviderModelType),
})
export type AIProviderModel = z.infer<typeof AIProviderModel>

export const AIProviderWithoutSensitiveData = z.object({
    id: z.string(),
    name: z.string(),
    provider: z.enum(AIProviderName),
    config: AIProviderConfig,
    enabledForChat: z.boolean(),
})
export type AIProviderWithoutSensitiveData = z.infer<typeof AIProviderWithoutSensitiveData>

export const GetProviderConfigResponse = z.object({
    provider: z.enum(AIProviderName),
    config: AIProviderConfig,
    auth: AIProviderAuthConfig,
    platformId: z.string(),
})
export type GetProviderConfigResponse = z.infer<typeof GetProviderConfigResponse>

export function splitCloudflareGatewayModelId(modelId: string): {
    provider: 'google-vertex-ai'
    publisher: string
    model: string
} | {
    provider: string
    model: string
    publisher: undefined
} | {
    provider: undefined
    model: string
    publisher: undefined
} {
    const slashIndex = modelId.indexOf('/')
    if (slashIndex === -1) {
        return {
            provider: undefined,
            model: modelId,
            publisher: undefined,
        }
    }
    const provider = modelId.substring(0, slashIndex).trim().toLowerCase()
    const rest = modelId.substring(slashIndex + 1)

    if (provider === 'google-vertex-ai') {
        const secondSlashIndex = rest.indexOf('/')
        if (secondSlashIndex === -1) {
            return {
                provider: undefined,
                model: modelId,
                publisher: undefined,
            }
        }
        return {
            provider: 'google-vertex-ai',
            publisher: rest.substring(0, secondSlashIndex),
            model: rest.substring(secondSlashIndex + 1),
        }
    }

    return {
        provider,
        model: rest,
        publisher: undefined,
    }
}

export function getEffectiveProviderAndModel({
    provider,
    model,
}: {
    provider: string | undefined
    model: string | undefined
}): { provider: string | undefined, model: string | undefined } {
    if (provider !== AIProviderName.CLOUDFLARE_GATEWAY || !model) {
        return { provider, model }
    }
    const split = splitCloudflareGatewayModelId(model)
    const gatewaySubmodelPrefix = (split.provider ?? '').trim().toLowerCase()
    const mapped = CF_GATEWAY_SUBMODEL_TO_PROVIDER[gatewaySubmodelPrefix]
    if (!mapped) {
        return { provider, model }
    }
    return { provider: mapped, model: split.model }
}

const CF_GATEWAY_SUBMODEL_TO_PROVIDER: Record<string, AIProviderName> = {
    openai: AIProviderName.OPENAI,
    anthropic: AIProviderName.ANTHROPIC,
    'google-ai-studio': AIProviderName.GOOGLE,
    'google-vertex-ai': AIProviderName.GOOGLE,
}
