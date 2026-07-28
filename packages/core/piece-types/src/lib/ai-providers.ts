import { AIProviderName, isNil } from '@activepieces/core-utils'
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

export const CloudflareGatewayProviderConfig = z.object({
    accountId: z.string(),
    gatewayId: z.string(),
    models: z.array(ProviderModelConfig),
    vertexProject: z.optional(z.string()),
    vertexRegion: z.optional(z.string()),
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

const OPENAI_CHAT_MODELS = ['gpt-5.5', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-4.1', 'gpt-4.1-mini'] as const
const ANTHROPIC_CHAT_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5'] as const
const ANTHROPIC_OPENROUTER_CHAT_MODELS = ['claude-sonnet-4.6', 'claude-opus-4.7', 'claude-haiku-4.5'] as const
const GOOGLE_CHAT_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview'] as const
const X_AI_OPENROUTER_CHAT_MODELS = ['grok-4.20', 'grok-4.1-fast'] as const

export const ALLOWED_CHAT_MODELS_BY_PROVIDER: Partial<Record<AIProviderName, readonly string[]>> = {
    [AIProviderName.OPENAI]: OPENAI_CHAT_MODELS,
    [AIProviderName.ANTHROPIC]: ANTHROPIC_CHAT_MODELS,
    [AIProviderName.GOOGLE]: GOOGLE_CHAT_MODELS,
    [AIProviderName.ACTIVEPIECES]: [
        ...ANTHROPIC_OPENROUTER_CHAT_MODELS.map((m) => `${AIProviderName.ANTHROPIC}/${m}`),
        ...OPENAI_CHAT_MODELS.map((m) => `${AIProviderName.OPENAI}/${m}`),
        ...GOOGLE_CHAT_MODELS.map((m) => `${AIProviderName.GOOGLE}/${m}`),
        ...X_AI_OPENROUTER_CHAT_MODELS.map((m) => `x-ai/${m}`),
    ],
}

const CHAT_MODEL_LABELS: Record<string, string> = {
    'gpt-5.5': 'GPT-5.5',
    'gpt-5.4-mini': 'GPT-5.4 mini',
    'gpt-5.4-nano': 'GPT-5.4 nano',
    'gpt-4.1': 'GPT-4.1',
    'gpt-4.1-mini': 'GPT-4.1 mini',
    'claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'claude-opus-4-7': 'Claude Opus 4.7',
    'claude-haiku-4-5': 'Claude Haiku 4.5',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
    'gemini-3-flash-preview': 'Gemini 3 Flash Preview',
}

function getCuratedChatModels({ provider }: { provider: AIProviderName }): { id: string, label: string }[] | undefined {
    const curatedIds = provider === AIProviderName.ACTIVEPIECES ? undefined : ALLOWED_CHAT_MODELS_BY_PROVIDER[provider]
    if (isNil(curatedIds) || curatedIds.length === 0) {
        return undefined
    }
    return curatedIds.map((id) => ({ id, label: CHAT_MODEL_LABELS[id] ?? id }))
}

function isCuratedChatModelId({ modelId }: { modelId: string }): boolean {
    if (ACTIVEPIECES_CHAT_TIERS.some((tier) => tier.id === modelId)) {
        return true
    }
    return Object.values(ALLOWED_CHAT_MODELS_BY_PROVIDER).some((curatedIds) => curatedIds.includes(modelId))
}

const DEFAULT_MAX_CONTEXT_TOKENS = 128_000

const PROVIDER_MAX_CONTEXT_TOKENS: Partial<Record<AIProviderName, number>> = {
    [AIProviderName.OPENAI]: 128_000,
    [AIProviderName.ANTHROPIC]: 200_000,
    [AIProviderName.GOOGLE]: 1_048_576,
    [AIProviderName.BEDROCK]: 200_000,
    [AIProviderName.AZURE]: 128_000,
    [AIProviderName.OPENROUTER]: 128_000,
    [AIProviderName.ACTIVEPIECES]: 200_000,
    [AIProviderName.MISTRAL]: 128_000,
}

function getMaxContextTokens({ provider }: { provider: AIProviderName | undefined }): number {
    if (!provider) return DEFAULT_MAX_CONTEXT_TOKENS
    return PROVIDER_MAX_CONTEXT_TOKENS[provider] ?? DEFAULT_MAX_CONTEXT_TOKENS
}

const DEFAULT_EMBEDDING_MODELS: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.OPENAI]: 'text-embedding-3-small',
    [AIProviderName.GOOGLE]: 'text-embedding-004',
    [AIProviderName.AZURE]: 'text-embedding-3-small',
    [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
    [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
}

const WEB_SEARCH_MODE_BY_PROVIDER: Partial<Record<AIProviderName, AIWebSearchMode>> = {
    [AIProviderName.ANTHROPIC]: 'native',
    [AIProviderName.GOOGLE]: 'native',
    [AIProviderName.OPENROUTER]: 'plugin',
    [AIProviderName.ACTIVEPIECES]: 'plugin',
}

const NO_IMAGE_GENERATION_PROVIDERS = new Set<AIProviderName>([
    AIProviderName.ANTHROPIC,
    AIProviderName.MISTRAL,
])

function buildProviderCapabilities(provider: AIProviderName): AIProviderCapabilities {
    return {
        chatModels: ALLOWED_CHAT_MODELS_BY_PROVIDER[provider],
        maxContextTokens: getMaxContextTokens({ provider }),
        defaultEmbeddingModel: DEFAULT_EMBEDDING_MODELS[provider],
        supportsEmbedding: DEFAULT_EMBEDDING_MODELS[provider] !== undefined,
        supportsImageGeneration: !NO_IMAGE_GENERATION_PROVIDERS.has(provider),
        webSearch: WEB_SEARCH_MODE_BY_PROVIDER[provider],
    }
}

export const ACTIVEPIECES_CHAT_TIERS = [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', thinkingBudget: 5_000, creditWeight: 2 },
    { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', thinkingBudget: 10_000, creditWeight: 10 },
    { id: 'premium', label: 'Heavy', modelId: 'anthropic/claude-opus-4.8', thinkingBudget: 20_000, creditWeight: 20 },
] as const

export const DEFAULT_CHAT_TIER_ID = 'smart' as const

export type ActivepiecesChatTier = typeof ACTIVEPIECES_CHAT_TIERS[number]

export const AI_PROVIDER_CAPABILITIES: Record<AIProviderName, AIProviderCapabilities> = {
    [AIProviderName.OPENAI]: buildProviderCapabilities(AIProviderName.OPENAI),
    [AIProviderName.ANTHROPIC]: buildProviderCapabilities(AIProviderName.ANTHROPIC),
    [AIProviderName.OPENROUTER]: buildProviderCapabilities(AIProviderName.OPENROUTER),
    [AIProviderName.AZURE]: buildProviderCapabilities(AIProviderName.AZURE),
    [AIProviderName.GOOGLE]: buildProviderCapabilities(AIProviderName.GOOGLE),
    [AIProviderName.CLOUDFLARE_GATEWAY]: buildProviderCapabilities(AIProviderName.CLOUDFLARE_GATEWAY),
    [AIProviderName.CUSTOM]: buildProviderCapabilities(AIProviderName.CUSTOM),
    [AIProviderName.BEDROCK]: buildProviderCapabilities(AIProviderName.BEDROCK),
    [AIProviderName.MISTRAL]: buildProviderCapabilities(AIProviderName.MISTRAL),
    [AIProviderName.ACTIVEPIECES]: buildProviderCapabilities(AIProviderName.ACTIVEPIECES),
}

export const aiProviderUtils = {
    getMaxContextTokens,
    getCuratedChatModels,
    isCuratedChatModelId,
}

export type AIWebSearchMode = 'native' | 'plugin'

export type AIProviderCapabilities = {
    chatModels?: readonly string[] | undefined
    maxContextTokens: number
    defaultEmbeddingModel: string | undefined
    supportsEmbedding: boolean
    supportsImageGeneration: boolean
    webSearch: AIWebSearchMode | undefined
}
