import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../common/base-model'

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const BaseAIProviderAuthConfig = Type.Object({
    apiKey: Type.String(),
})
export type BaseAIProviderAuthConfig = Static<typeof BaseAIProviderAuthConfig>

export const AnthropicProviderAuthConfig = BaseAIProviderAuthConfig
export type AnthropicProviderAuthConfig = Static<typeof AnthropicProviderAuthConfig>

export const ActivePiecesProviderAuthConfig = Type.Intersect([
    BaseAIProviderAuthConfig,
    Type.Object({
        apiKeyHash: Type.String(),
    }),
])
export type ActivePiecesProviderAuthConfig = Static<typeof ActivePiecesProviderAuthConfig>

export const OpenAICompatibleProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenAICompatibleProviderAuthConfig = Static<typeof OpenAICompatibleProviderAuthConfig>

export const CloudflareGatewayProviderAuthConfig = BaseAIProviderAuthConfig
export type CloudflareGatewayProviderAuthConfig = Static<typeof CloudflareGatewayProviderAuthConfig>

export const AzureProviderAuthConfig = BaseAIProviderAuthConfig
export type AzureProviderAuthConfig = Static<typeof AzureProviderAuthConfig>

export const GoogleProviderAuthConfig = BaseAIProviderAuthConfig
export type GoogleProviderAuthConfig = Static<typeof GoogleProviderAuthConfig>

export const OpenAIProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenAIProviderAuthConfig = Static<typeof OpenAIProviderAuthConfig>

export const OpenRouterProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenRouterProviderAuthConfig = Static<typeof OpenRouterProviderAuthConfig>

export const AnthropicProviderConfig = Type.Object({})
export type AnthropicProviderConfig = Static<typeof AnthropicProviderConfig>

export const ActivePiecesProviderConfig = Type.Object({})
export type ActivePiecesProviderConfig = Static<typeof ActivePiecesProviderConfig>

export const ProviderModelConfig = Type.Object({
    modelId: Type.String(),
    modelName: Type.String(),
    modelType: Type.Enum(AIProviderModelType),
})
export type ProviderModelConfig = Static<typeof ProviderModelConfig>

export const OpenAICompatibleProviderConfig = Type.Object({
    apiKeyHeader: Type.String(),
    baseUrl: Type.String(),
    models: Type.Array(ProviderModelConfig),
})
export type OpenAICompatibleProviderConfig = Static<typeof OpenAICompatibleProviderConfig>


export const CloudflareGatewayProviderConfig = Type.Object({
    accountId: Type.String(),
    gatewayId: Type.String(),
    models: Type.Array(ProviderModelConfig),
})
export type CloudflareGatewayProviderConfig = Static<typeof CloudflareGatewayProviderConfig>

export const AzureProviderConfig = Type.Object({
    resourceName: Type.String(),
})
export type AzureProviderConfig = Static<typeof AzureProviderConfig>

export const GoogleProviderConfig = Type.Object({})
export type GoogleProviderConfig = Static<typeof GoogleProviderConfig>

export const OpenAIProviderConfig = Type.Object({})
export type OpenAIProviderConfig = Static<typeof OpenAIProviderConfig>

export const OpenRouterProviderConfig = Type.Object({})
export type OpenRouterProviderConfig = Static<typeof OpenRouterProviderConfig>

export const AIProviderAuthConfig = Type.Union([
    AnthropicProviderAuthConfig,
    AzureProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
    OpenRouterProviderAuthConfig,
    CloudflareGatewayProviderAuthConfig,
    OpenAICompatibleProviderAuthConfig,
    ActivePiecesProviderAuthConfig,
])
export type AIProviderAuthConfig = Static<typeof AIProviderAuthConfig>
// Order matters, put schemas with required fields first, empty ones last. This is to avoid empty objects matching any object.
export const AIProviderConfig = Type.Union([
    OpenAICompatibleProviderConfig,
    CloudflareGatewayProviderConfig,
    AzureProviderConfig,
    AnthropicProviderConfig,
    GoogleProviderConfig,
    OpenAIProviderConfig,
    OpenRouterProviderConfig,
    ActivePiecesProviderConfig,
])
export type AIProviderConfig = Static<typeof AIProviderConfig>

export enum AIProviderName {
    OPENAI = 'openai',
    OPENROUTER = 'openrouter',
    ANTHROPIC = 'anthropic',
    AZURE = 'azure',
    GOOGLE = 'google',
    ACTIVEPIECES = 'activepieces',
    CLOUDFLARE_GATEWAY = 'cloudflare-gateway',
    CUSTOM = 'custom',
}

const ProviderConfigUnion = DiscriminatedUnion('provider', [
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.OPENAI),
        config: OpenAIProviderConfig,
        auth: OpenAIProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.OPENROUTER),
        config: OpenRouterProviderConfig,
        auth: OpenRouterProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.ANTHROPIC),
        config: AnthropicProviderConfig,
        auth: AnthropicProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
        auth: AzureProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.GOOGLE),
        config: GoogleProviderConfig,
        auth: GoogleProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.CLOUDFLARE_GATEWAY),
        config: CloudflareGatewayProviderConfig,
        auth: CloudflareGatewayProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.CUSTOM),
        config: OpenAICompatibleProviderConfig,
        auth: OpenAICompatibleProviderAuthConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.ACTIVEPIECES),
        config: ActivePiecesProviderConfig,
        auth: ActivePiecesProviderAuthConfig,
    }),
])

export const AIProvider = Type.Intersect([
    Type.Object({ ...BaseModelSchema }),
    ProviderConfigUnion,
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        platformId: Type.String(),
    }),
])

export type AIProvider = Static<typeof AIProvider>

export const AIProviderWithoutSensitiveData = Type.Object({
    id: Type.String(),
    name: Type.String(),
    provider: Type.Enum(AIProviderName),
    config: AIProviderConfig,
})
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>

export const AIProviderModel = Type.Object({
    id: Type.String(),
    name: Type.String(),
    type: Type.Enum(AIProviderModelType),
})
export type AIProviderModel = Static<typeof AIProviderModel>

export const CreateAIProviderRequest = ProviderConfigUnion
export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>


export const UpdateAIProviderRequest = Type.Object({
    displayName: Type.String({ minLength: 1 }),
    config: Type.Optional(AIProviderConfig),
    auth: Type.Optional(AIProviderAuthConfig),
})
export type UpdateAIProviderRequest = Static<typeof UpdateAIProviderRequest>


export const GetProviderConfigResponse = Type.Object({
    provider: Type.Enum(AIProviderName),
    config: AIProviderConfig,
    auth: AIProviderAuthConfig,
})
export type GetProviderConfigResponse = Static<typeof GetProviderConfigResponse>


export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>
