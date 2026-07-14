import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

export enum AiToolCapability {
    WEB_SEARCH = 'WEB_SEARCH',
    WEB_SCRAPING = 'WEB_SCRAPING',
    IMAGE_GENERATION = 'IMAGE_GENERATION',
}

export enum AiToolProvider {
    TAVILY = 'tavily',
    FIRECRAWL = 'firecrawl',
    APIFY = 'apify',
    FAL = 'fal',
    APOLLO = 'apollo',
}

export const PROVIDERS_BY_CAPABILITY: Record<AiToolCapability, AiToolProvider[]> = {
    [AiToolCapability.WEB_SEARCH]: [AiToolProvider.TAVILY],
    [AiToolCapability.WEB_SCRAPING]: [AiToolProvider.FIRECRAWL, AiToolProvider.APIFY],
    [AiToolCapability.IMAGE_GENERATION]: [AiToolProvider.FAL],
}

export const AiToolAuthConfig = z.object({
    apiKey: z.string().min(1, formErrors.required),
})
export type AiToolAuthConfig = z.infer<typeof AiToolAuthConfig>

export const AiToolProviderConfig = z.record(z.string(), z.unknown())
export type AiToolProviderConfig = z.infer<typeof AiToolProviderConfig>

export const AiToolConfig = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    capability: z.enum(AiToolCapability),
    provider: z.enum(AiToolProvider),
    config: AiToolProviderConfig.nullable(),
    enabled: z.boolean(),
})
export type AiToolConfig = z.infer<typeof AiToolConfig>

export const AiToolConfigWithoutSensitiveData = z.object({
    id: z.string(),
    capability: z.enum(AiToolCapability),
    provider: z.enum(AiToolProvider),
    config: AiToolProviderConfig.nullable(),
    enabled: z.boolean(),
    hasApiKey: z.boolean(),
})
export type AiToolConfigWithoutSensitiveData = z.infer<typeof AiToolConfigWithoutSensitiveData>

export const CreateAiToolConfigRequest = z.object({
    capability: z.enum(AiToolCapability),
    provider: z.enum(AiToolProvider),
    auth: AiToolAuthConfig,
    config: AiToolProviderConfig.optional(),
    enabled: z.boolean().optional(),
})
export type CreateAiToolConfigRequest = z.infer<typeof CreateAiToolConfigRequest>

export const UpdateAiToolConfigRequest = z.object({
    provider: z.enum(AiToolProvider).optional(),
    auth: AiToolAuthConfig.optional(),
    config: AiToolProviderConfig.optional(),
    enabled: z.boolean().optional(),
})
export type UpdateAiToolConfigRequest = z.infer<typeof UpdateAiToolConfigRequest>

export const ResolvedAiTool = z.object({
    provider: z.enum(AiToolProvider),
    apiKey: z.string(),
    config: AiToolProviderConfig.optional(),
})
export type ResolvedAiTool = z.infer<typeof ResolvedAiTool>

export const GetEnabledAiToolsResponse = z.object({
    webSearch: ResolvedAiTool.optional(),
    webScraping: ResolvedAiTool.optional(),
    imageGeneration: ResolvedAiTool.optional(),
})
export type GetEnabledAiToolsResponse = z.infer<typeof GetEnabledAiToolsResponse>
