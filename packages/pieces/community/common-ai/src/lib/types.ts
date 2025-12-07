import { BaseModelSchema, DiscriminatedUnion, SeekPage } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

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

export enum AIProviderName {
    OpenAI = 'openai',
    OpenRouter = 'openrouter',
    Anthropic = 'anthropic',
    Azure = 'azure',
    Google = 'google',
}

const ProviderConfigUnion = Type.Union([
    Type.Object({
        provider: Type.Literal(AIProviderName.OpenAI),
        config: OpenAIProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.OpenRouter),
        config: OpenRouterProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.Anthropic),
        config: AnthropicProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.Azure),
        config: AzureProviderConfig,
    }),
    Type.Object({
        provider: Type.Literal(AIProviderName.Google),
        config: GoogleProviderConfig,
    }),
]);

export const AIProvider = Type.Intersect([
    Type.Object({ ...BaseModelSchema }),
    ProviderConfigUnion,
    Type.Object({
        displayName: Type.String({ minLength: 1 }),
        platformId: Type.String(),
    }),
]);

export type AIProvider = Static<typeof AIProvider>

export const AIProviderWithoutSensitiveData = Type.Object({
    id: Type.String(),
    name: Type.String(),
    isConfigured: Type.Boolean(),
})
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>

export enum AIProviderModelType {
    Image = 'image',
    Text = 'text',
}

export const AIProviderModel = Type.Object({
    id: Type.String(),
    name: Type.String(),
    type: Type.Enum(AIProviderModelType),
})
export type AIProviderModel = Static<typeof AIProviderModel>

export const CreateAIProviderRequest = ProviderConfigUnion

export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>


// ----- AI USAGE ----- 
export const AI_USAGE_FEATURE_HEADER = 'ap-feature'
export const AI_USAGE_AGENT_ID_HEADER = 'ap-agent-id'
export const AI_USAGE_MCP_ID_HEADER = 'ap-mcp-id'

export enum AIUsageFeature {
    AGENTS = 'Agents',   
    MCP = 'MCP',
    TEXT_AI = 'Text AI',
    IMAGE_AI = 'Image AI',
    UTILITY_AI = 'Utility AI',
    VIDEO_AI = 'Video AI',
    UNKNOWN = 'Unknown',
}

const agentMetadata = Type.Object({
    feature: Type.Literal(AIUsageFeature.AGENTS),
    agentid: Type.String(),
})

const mcpMetadata = Type.Object({
    feature: Type.Literal(AIUsageFeature.MCP),
    mcpid: Type.String(),
})

const videoMetadata = Type.Object({
    feature: Type.Literal(AIUsageFeature.VIDEO_AI),
    videoOperationId: Type.String(),
})

const simpleFeatures = [AIUsageFeature.TEXT_AI, AIUsageFeature.IMAGE_AI, AIUsageFeature.UTILITY_AI, AIUsageFeature.VIDEO_AI, AIUsageFeature.UNKNOWN] as const
const simpleMetadataVariants = simpleFeatures.map(feature => 
    Type.Object({
        feature: Type.Literal(feature),
    }),
)

export const AIUsageMetadata = DiscriminatedUnion('feature', [
    agentMetadata,
    mcpMetadata,
    videoMetadata,
    ...simpleMetadataVariants,
])

export type AIUsageMetadata = Static<typeof AIUsageMetadata>

export const AIUsage = Type.Object({
    ...BaseModelSchema,
    provider: Type.String({ minLength: 1 }),
    model: Type.String({ minLength: 1 }),
    cost: Type.Number({ minimum: 0 }),
    projectId: Type.String(),
    platformId: Type.String(),
    metadata: AIUsageMetadata,
})

export type AIUsage = Static<typeof AIUsage>

export const ListAICreditsUsageRequest = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
    cursor: Type.Optional(Type.String()),
})

export type ListAICreditsUsageRequest = Static<typeof ListAICreditsUsageRequest>

export const ListAICreditsUsageResponse = SeekPage(
    Type.Intersect([
        Type.Omit(AIUsage, ['cost']),
        Type.Object({
            credits: Type.Number(),
            projectName: Type.String(),
        }),
    ]),
)

export type ListAICreditsUsageResponse = Static<typeof ListAICreditsUsageResponse>

export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>
