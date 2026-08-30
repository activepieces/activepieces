import { AiProviderKeyStatus, AIProviderName, BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const BaseAIProviderAuthConfig = z.object({
    apiKey: z.string(),
})
export type BaseAIProviderAuthConfig = z.infer<typeof BaseAIProviderAuthConfig>

export const AnthropicProviderAuthConfig = BaseAIProviderAuthConfig
export type AnthropicProviderAuthConfig = z.infer<typeof AnthropicProviderAuthConfig>

export const ActivePiecesProviderAuthConfig = BaseAIProviderAuthConfig.extend({
    apiKeyHash: z.string(),
})
export type ActivePiecesProviderAuthConfig = z.infer<typeof ActivePiecesProviderAuthConfig>

export const OpenAICompatibleProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenAICompatibleProviderAuthConfig = z.infer<typeof OpenAICompatibleProviderAuthConfig>

export const CloudflareGatewayProviderAuthConfig = BaseAIProviderAuthConfig
export type CloudflareGatewayProviderAuthConfig = z.infer<typeof CloudflareGatewayProviderAuthConfig>

export const AzureProviderAuthConfig = BaseAIProviderAuthConfig
export type AzureProviderAuthConfig = z.infer<typeof AzureProviderAuthConfig>

export const GoogleProviderAuthConfig = BaseAIProviderAuthConfig
export type GoogleProviderAuthConfig = z.infer<typeof GoogleProviderAuthConfig>

export const OpenAIProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenAIProviderAuthConfig = z.infer<typeof OpenAIProviderAuthConfig>

export const OpenRouterProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenRouterProviderAuthConfig = z.infer<typeof OpenRouterProviderAuthConfig>

export const BedrockProviderAuthConfig = z.object({
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
})
export type BedrockProviderAuthConfig = z.infer<typeof BedrockProviderAuthConfig>

export const MistralProviderAuthConfig = BaseAIProviderAuthConfig
export type MistralProviderAuthConfig = z.infer<typeof MistralProviderAuthConfig>

export const AnthropicProviderConfig = z.object({})
export type AnthropicProviderConfig = z.infer<typeof AnthropicProviderConfig>

export const ActivePiecesProviderConfig = z.object({})
export type ActivePiecesProviderConfig = z.infer<typeof ActivePiecesProviderConfig>

export const ProviderModelConfig = z.object({
    modelId: z.string(),
    modelName: z.string(),
    modelType: z.nativeEnum(AIProviderModelType),
})
export type ProviderModelConfig = z.infer<typeof ProviderModelConfig>

export const OpenAICompatibleProviderConfig = z.object({
    apiKeyHeader: z.string(),
    baseUrl: z.string(),
    models: z.array(ProviderModelConfig),
    defaultHeaders: z.record(z.string(), z.string()).optional(),
    apiStyle: z.enum(['chat', 'responses']).optional(),
})
export type OpenAICompatibleProviderConfig = z.infer<typeof OpenAICompatibleProviderConfig>


export const CloudflareGatewayProviderConfig = z.object({
    accountId: z.string(),
    gatewayId: z.string(),
    models: z.array(ProviderModelConfig),
    vertexProject: z.string().optional(),
    vertexRegion: z.string().optional(),
})
export type CloudflareGatewayProviderConfig = z.infer<typeof CloudflareGatewayProviderConfig>

export const AzureProviderConfig = z.object({
    resourceName: z.string(),
    apiVersion: z.preprocess(
        (v) => (typeof v === 'string' && v.trim().length === 0 ? undefined : v),
        z.string().optional(),
    ),
})
export type AzureProviderConfig = z.infer<typeof AzureProviderConfig>

export const GoogleProviderConfig = z.object({})
export type GoogleProviderConfig = z.infer<typeof GoogleProviderConfig>

export const OpenAIProviderConfig = z.object({})
export type OpenAIProviderConfig = z.infer<typeof OpenAIProviderConfig>

export const OpenRouterProviderConfig = z.object({})
export type OpenRouterProviderConfig = z.infer<typeof OpenRouterProviderConfig>

export const BedrockProviderConfig = z.object({
    region: z.string().min(1),
})
export type BedrockProviderConfig = z.infer<typeof BedrockProviderConfig>

export const MistralProviderConfig = z.object({})
export type MistralProviderConfig = z.infer<typeof MistralProviderConfig>

export const OpenAiCompatibleVendorConfig = z.object({})
export type OpenAiCompatibleVendorConfig = z.infer<typeof OpenAiCompatibleVendorConfig>

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
    OpenAiCompatibleVendorConfig,
])
export type AIProviderConfig = z.infer<typeof AIProviderConfig>

const ProviderConfigUnion = z.discriminatedUnion('provider', [
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.OPENAI),
        config: OpenAIProviderConfig,
        auth: OpenAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.OPENROUTER),
        config: OpenRouterProviderConfig,
        auth: OpenRouterProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.ANTHROPIC),
        config: AnthropicProviderConfig,
        auth: AnthropicProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
        auth: AzureProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.GOOGLE),
        config: GoogleProviderConfig,
        auth: GoogleProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.CLOUDFLARE_GATEWAY),
        config: CloudflareGatewayProviderConfig,
        auth: CloudflareGatewayProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.CUSTOM),
        config: OpenAICompatibleProviderConfig,
        auth: OpenAICompatibleProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.ACTIVEPIECES),
        config: ActivePiecesProviderConfig,
        auth: ActivePiecesProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.BEDROCK),
        config: BedrockProviderConfig,
        auth: BedrockProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.MISTRAL),
        config: MistralProviderConfig,
        auth: MistralProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.XAI),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.DEEPSEEK),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.ZAI),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.QWEN),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.MINIMAX),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.MOONSHOT),
        config: OpenAiCompatibleVendorConfig,
        auth: BaseAIProviderAuthConfig,
    }),
])

export const AIProvider = z.object({
    ...BaseModelSchema,
    displayName: z.string().min(1),
    platformId: z.string(),
}).and(ProviderConfigUnion)

export type AIProvider = z.infer<typeof AIProvider>

export const AiProviderModelScope = z.enum(['all', 'selected'])
export type AiProviderModelScope = z.infer<typeof AiProviderModelScope>

export const AiProviderProjectScope = z.enum(['all', 'selected', 'except'])
export type AiProviderProjectScope = z.infer<typeof AiProviderProjectScope>

export const AIProviderWithoutSensitiveData = z.object({
    id: z.string(),
    name: z.string(),
    provider: z.nativeEnum(AIProviderName),
    config: AIProviderConfig,
    enabledForChat: z.boolean(),
    modelScope: AiProviderModelScope,
    modelIds: z.array(z.string()),
    projectScope: AiProviderProjectScope,
    projectIds: z.array(z.string()),
    status: AiProviderKeyStatus,
    statusReason: z.string().nullable(),
    statusUpdated: z.string().nullable(),
})
export type AIProviderWithoutSensitiveData = z.infer<typeof AIProviderWithoutSensitiveData>

export const ProjectAIProviderKey = z.object({
    id: z.string(),
    name: z.string(),
})
export type ProjectAIProviderKey = z.infer<typeof ProjectAIProviderKey>

export const ProjectAIProvider = z.object({
    provider: z.nativeEnum(AIProviderName),
    name: z.string(),
    enabledForChat: z.boolean(),
    keys: z.array(ProjectAIProviderKey),
})
export type ProjectAIProvider = z.infer<typeof ProjectAIProvider>

export const AIProviderModelMetadata = z.object({
    contextTokens: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    releaseDate: z.string().optional(),
    inputCostPerMillionTokens: z.number().optional(),
    outputCostPerMillionTokens: z.number().optional(),
    supportsToolCalling: z.boolean().optional(),
    supportsReasoning: z.boolean().optional(),
    supportsVision: z.boolean().optional(),
})
export type AIProviderModelMetadata = z.infer<typeof AIProviderModelMetadata>

export const AIProviderModel = z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(AIProviderModelType),
    metadata: AIProviderModelMetadata.optional(),
})
export type AIProviderModel = z.infer<typeof AIProviderModel>

export const CreateAIProviderRequest = ProviderConfigUnion
export type CreateAIProviderRequest = z.infer<typeof CreateAIProviderRequest>


export const UpdateAIProviderRequest = z.object({
    displayName: z.string().min(1),
    config: AIProviderConfig.optional(),
    auth: AIProviderAuthConfig.optional(),
    enabledForChat: z.boolean().optional(),
    modelScope: AiProviderModelScope.optional(),
    modelIds: z.array(z.string()).optional(),
    projectScope: AiProviderProjectScope.optional(),
    projectIds: z.array(z.string()).optional(),
})
export type UpdateAIProviderRequest = z.infer<typeof UpdateAIProviderRequest>


export const GetProviderConfigResponse = z.object({
    provider: z.nativeEnum(AIProviderName),
    configId: z.string(),
    config: AIProviderConfig,
    auth: AIProviderAuthConfig,
    platformId: z.string(),
})
export type GetProviderConfigResponse = z.infer<typeof GetProviderConfigResponse>


export const AIErrorResponse = z.object({
    error: z.object({
        message: z.string(),
        type: z.string(),
        code: z.string(),
    }),
})

export type AIErrorResponse = z.infer<typeof AIErrorResponse>
/**
 * Resolves the effective provider and model for capability decisions. For direct providers
 * this is the same pair that came in. For Cloudflare Gateway (which tunnels to a submodel
 * like "openai/gpt-4"), it returns the underlying provider inferred from the prefix and the
 * submodel portion of the id.
 *
 * Callers can use this to decide which provider-specific capabilities apply (e.g. which
 * web-search tool builder to use, which advancedOptions schema to render). Unrecognized
 * prefixes or missing input fall back to the raw inputs so callers never end up with a
 * wrong-but-confident answer.
 */
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
    // Prefix must match map keys (lowercase); some gateways/UI send "OpenAI/...".
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

/**
 * Splits a Cloudflare Gateway model ID into provider and model, i.e. "google-vertex-ai/google/gemini-2.5-pro" -> { provider: "google-vertex-ai", model: "google/gemini-2.5-pro" }.
 * @param modelId - The model ID to split.
 * @returns An object containing the provider and model.
 */
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
        //console.error(`Invalid model ID "${modelId}": expected format "provider/model"`)
        return {
            provider: undefined,
            model: modelId,
            publisher: undefined,
        }
    }
    // Normalize first path segment: AI Gateway and docs use lowercase (e.g. "openai/gpt-4o").
    const provider = modelId.substring(0, slashIndex).trim().toLowerCase()
    const rest = modelId.substring(slashIndex + 1)

    if (provider === 'google-vertex-ai') {
        const secondSlashIndex = rest.indexOf('/')
        if (secondSlashIndex === -1) {
            //console.error(`Invalid Google Vertex AI model ID "${modelId}": expected format "google-vertex-ai/publisher/model"`)
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

export {
    AI_PROVIDER_ENTITY_TYPES,
    ALLOWED_CHAT_MODELS_BY_PROVIDER,
    ACTIVEPIECES_CHAT_TIERS,
    DEFAULT_CHAT_TIER_ID,
    AI_PROVIDER_CAPABILITIES,
    OPENAI_COMPATIBLE_VENDOR_BASE_URLS,
    aiProviderUtils,
} from '@activepieces/core-piece-types'
export type { ActivepiecesChatTier, AIProviderCapabilities, AIWebSearchMode, OpenAiCompatibleVendor } from '@activepieces/core-piece-types'
