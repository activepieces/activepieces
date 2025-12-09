import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../common/base-model'

export const AnthropicProviderConfig = Type.Object({
    apiKey: Type.String(),
})
export type AnthropicProviderConfig = Static<typeof AnthropicProviderConfig>

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
])
export type AIProviderConfig = Static<typeof AIProviderConfig>

export enum 
    AIProviderName {
    OPENAI = 'openai',
    OPENROUTER = 'openrouter',
    ANTHROPIC = 'anthropic',
    AZURE = 'azure',
    GOOGLE = 'google',
    ACTIVEPIECES = 'activepieces',
}

const ProviderConfigUnion = DiscriminatedUnion('provider', [
    Type.Object({
        provider: Type.Literal(AIProviderName.OPENAI),
        config: OpenAIProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.OPENROUTER),
        config: OpenRouterProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.ANTHROPIC),
        config: AnthropicProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.GOOGLE),
        config: GoogleProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.ACTIVEPIECES),
        config: OpenRouterProviderConfig,
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
    configured: Type.Boolean(),
})
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const AIProviderModel = Type.Object({
    id: Type.String(),
    name: Type.String(),
    type: Type.Enum(AIProviderModelType),
})
export type AIProviderModel = Static<typeof AIProviderModel>

export const CreateAIProviderRequest = ProviderConfigUnion

export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>


export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>
