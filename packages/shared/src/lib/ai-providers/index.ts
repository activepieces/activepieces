import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../common/base-model'

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const AnthropicProviderConfig = Type.Object({
    apiKey: Type.String(),
})
export type AnthropicProviderConfig = Static<typeof AnthropicProviderConfig>

export const OpenAICompatibleProviderConfig = Type.Object({
    apiKey: Type.String(),
    apiKeyHeader: Type.String(),
    baseUrl: Type.String(),
    models: Type.Array(
        Type.Object({
            modelId: Type.String(),
            modelName: Type.String(),
            modelType: Type.Enum(AIProviderModelType),
        }),
    ),
})
export type OpenAICompatibleProviderConfig = Static<typeof OpenAICompatibleProviderConfig>


export const CloudflareGatewayProviderConfig = Type.Object({
    apiKey: Type.String(),
    accountId: Type.String(),
    gatewayId: Type.String(),
    models: Type.Array(
        Type.Object({
            modelId: Type.String(),
            modelName: Type.String(),
            modelType: Type.Enum(AIProviderModelType),
        }),
    ),
})
export type CloudflareGatewayProviderConfig = Static<typeof CloudflareGatewayProviderConfig>

export const AzureProviderConfig = Type.Object({
    apiKey: Type.String(),
    resourceName: Type.String(),
})
export type AzureProviderConfig = Static<typeof AzureProviderConfig>

export const GoogleProviderConfig = Type.Object({
    apiKey: Type.String(),
})
export type GoogleProviderConfig = Static<typeof GoogleProviderConfig>

export const OpenAIProviderConfig = Type.Object({
    apiKey: Type.String(),
})
export type OpenAIProviderConfig = Static<typeof OpenAIProviderConfig>

export const OpenRouterProviderConfig = Type.Object({
    apiKey: Type.String(),
})
export type OpenRouterProviderConfig = Static<typeof OpenRouterProviderConfig>

export const AIProviderConfig = Type.Union([
    AnthropicProviderConfig,
    AzureProviderConfig,
    GoogleProviderConfig,
    OpenAIProviderConfig,
    OpenRouterProviderConfig,
    CloudflareGatewayProviderConfig,
    OpenAICompatibleProviderConfig,
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
    OPENAI_COMPATIBLE = 'openai-compatible',
}

const ProviderConfigUnion = DiscriminatedUnion('provider', [
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.OPENAI),
        config: OpenAIProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.OPENROUTER),
        config: OpenRouterProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.ANTHROPIC),
        config: AnthropicProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.GOOGLE),
        config: GoogleProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.ACTIVEPIECES),
        config: OpenRouterProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.CLOUDFLARE_GATEWAY),
        config: CloudflareGatewayProviderConfig,
    }),
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        provider: Type.Literal(AIProviderName.OPENAI_COMPATIBLE),
        config: OpenAICompatibleProviderConfig,
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

    // DEPRECTED: KEPT FOR BACKWARD COMPATIBILITY
    configured: Type.Boolean(),
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


export const GetProviderConfigResponse = Type.Intersect([
    AIProviderConfig,
    Type.Object({
        provider: Type.Enum(AIProviderName),
    }),
])
export type GetProviderConfigResponse = Static<typeof GetProviderConfigResponse>


export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>
