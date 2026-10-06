import { z } from 'zod'
import { formErrors } from './form-errors'
import { AIProviderName } from './permission'

export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const BaseAIProviderAuthConfig = z.object({
    apiKey: z.string(),
})
export type BaseAIProviderAuthConfig = z.infer<typeof BaseAIProviderAuthConfig>

export const VertexProviderAuthConfig = z.object({
    serviceAccountJson: z.string().min(1),
})
export type VertexProviderAuthConfig = z.infer<typeof VertexProviderAuthConfig>

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
    sessionToken: z.string().optional(),
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
    modelType: z.enum(AIProviderModelType),
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

export const VertexProviderConfig = z.object({
    project: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/, formErrors.invalidGcpResourceId),
    region: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/, formErrors.invalidGcpResourceId),
    models: z.array(ProviderModelConfig),
})
export type VertexProviderConfig = z.infer<typeof VertexProviderConfig>

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
    VertexProviderAuthConfig,
    MistralProviderAuthConfig,
])
export type AIProviderAuthConfig = z.infer<typeof AIProviderAuthConfig>
// Order matters, put schemas with required fields first, empty ones last. This is to avoid empty objects matching any object.
export const AIProviderConfig = z.union([
    OpenAICompatibleProviderConfig,
    CloudflareGatewayProviderConfig,
    AzureProviderConfig,
    VertexProviderConfig,
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

export const AiProviderCredentials = z.discriminatedUnion('provider', [
    z.object({ provider: z.literal(AIProviderName.OPENAI), config: OpenAIProviderConfig.partial(), auth: OpenAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.OPENROUTER), config: OpenRouterProviderConfig.partial(), auth: OpenRouterProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.ANTHROPIC), config: AnthropicProviderConfig.partial(), auth: AnthropicProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.AZURE), config: AzureProviderConfig.partial(), auth: AzureProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.GOOGLE), config: GoogleProviderConfig.partial(), auth: GoogleProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.CLOUDFLARE_GATEWAY), config: CloudflareGatewayProviderConfig.partial(), auth: CloudflareGatewayProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.CUSTOM), config: OpenAICompatibleProviderConfig.partial(), auth: OpenAICompatibleProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.ACTIVEPIECES), config: ActivePiecesProviderConfig.partial(), auth: ActivePiecesProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.BEDROCK), config: BedrockProviderConfig.partial(), auth: BedrockProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.VERTEX), config: VertexProviderConfig.partial(), auth: VertexProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.MISTRAL), config: MistralProviderConfig.partial(), auth: MistralProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.XAI), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.DEEPSEEK), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.ZAI), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.QWEN), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.MINIMAX), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
    z.object({ provider: z.literal(AIProviderName.MOONSHOT), config: OpenAiCompatibleVendorConfig.partial(), auth: BaseAIProviderAuthConfig.partial() }),
])
export type AiProviderCredentials = z.infer<typeof AiProviderCredentials>

export function aiProviderCredentials({ provider, auth, config }: { provider: AIProviderName, auth: unknown, config: unknown }): AiProviderCredentials {
    const parsed = AiProviderCredentials.safeParse({ provider, auth, config })
    if (parsed.success) {
        return parsed.data
    }
    const authOnly = AiProviderCredentials.safeParse({ provider, auth, config: {} })
    if (authOnly.success) {
        return authOnly.data
    }
    return AiProviderCredentials.parse({ provider, auth: {}, config: {} })
}
