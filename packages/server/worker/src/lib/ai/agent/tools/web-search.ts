import { AIProviderName, getEffectiveProviderAndModel, isNil, spreadIfDefined } from '@activepieces/shared'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { ToolSet } from 'ai'

const anthropicSearchTool = anthropic.tools.webSearch_20250305
const openaiSearchTool = openai.tools.webSearchPreview
const googleSearchTool = google.tools.googleSearch

const DEFAULT_MAX_USES = 5

/**
 * Worker-side port of the AI piece's `buildWebSearchConfig`. Web search is provider-native — for
 * Anthropic/OpenAI/Google it surfaces as a tool the model invokes itself (no worker/engine hop, no
 * outbound HTTP from us); for OpenRouter/Activepieces it is a request-level provider option. The raw
 * `webSearchOptions` arrive as an untyped record (they came from the sandbox-supplied config), so we
 * read each field defensively rather than casting.
 */
export function buildWebSearchConfig(params: BuildWebSearchConfigParams): WebSearchConfig {
    const { provider, model, webSearchEnabled, webSearchOptions } = params
    if (!webSearchEnabled) {
        return { tools: undefined, providerOptions: undefined, maxUses: DEFAULT_MAX_USES }
    }

    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model })
    const resolvedProvider = effectiveProvider ?? provider
    const options = webSearchOptions ?? {}
    const maxUses = readNumber(options, 'maxUses') ?? DEFAULT_MAX_USES

    const isOpenRouter = resolvedProvider === AIProviderName.OPENROUTER || resolvedProvider === AIProviderName.ACTIVEPIECES
    if (isOpenRouter) {
        const maxResults = Math.min(Math.max(maxUses, 1), 10)
        return {
            tools: undefined,
            providerOptions: { openrouter: { plugins: [{ id: 'web', max_results: maxResults }] } },
            maxUses,
        }
    }

    return { tools: createWebSearchTool(resolvedProvider, options), providerOptions: undefined, maxUses }
}

function createWebSearchTool(provider: string, options: Record<string, unknown>): ToolSet {
    switch (provider) {
        case AIProviderName.ANTHROPIC: {
            const allowedDomains = readDomains(options, 'allowedDomains')
            const blockedDomains = isNil(allowedDomains) ? readDomains(options, 'blockedDomains') : undefined
            return {
                web_search: anthropicSearchTool({
                    maxUses: readNumber(options, 'maxUses') ?? DEFAULT_MAX_USES,
                    ...spreadIfDefined('userLocation', buildUserLocation(options)),
                    ...spreadIfDefined('allowedDomains', allowedDomains),
                    ...spreadIfDefined('blockedDomains', blockedDomains),
                }),
            }
        }
        case AIProviderName.OPENAI: {
            return {
                web_search_preview: openaiSearchTool({
                    ...spreadIfDefined('searchContextSize', readSearchContextSize(options)),
                    ...spreadIfDefined('userLocation', buildUserLocation(options)),
                }),
            }
        }
        case AIProviderName.GOOGLE: {
            return { google_search: googleSearchTool({}) }
        }
        default:
            throw new Error(`Provider ${provider} is not supported for web search`)
    }
}

function buildUserLocation(options: Record<string, unknown>): UserLocation | undefined {
    const city = readString(options, 'userLocationCity')
    const region = readString(options, 'userLocationRegion')
    const country = readString(options, 'userLocationCountry')
    const timezone = readString(options, 'userLocationTimezone')
    if (isNil(city) && isNil(region) && isNil(country) && isNil(timezone)) {
        return undefined
    }
    return {
        type: 'approximate',
        ...spreadIfDefined('city', city),
        ...spreadIfDefined('region', region),
        ...spreadIfDefined('country', country),
        ...spreadIfDefined('timezone', timezone),
    }
}

function readNumber(options: Record<string, unknown>, key: string): number | undefined {
    const value = options[key]
    return typeof value === 'number' ? value : undefined
}

function readString(options: Record<string, unknown>, key: string): string | undefined {
    const value = options[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readSearchContextSize(options: Record<string, unknown>): 'low' | 'medium' | 'high' | undefined {
    const value = options['searchContextSize']
    return value === 'low' || value === 'medium' || value === 'high' ? value : undefined
}

function readDomains(options: Record<string, unknown>, key: string): string[] | undefined {
    const value = options[key]
    if (!Array.isArray(value)) {
        return undefined
    }
    const domains = value.flatMap((item) => isRecord(item) && typeof item['domain'] === 'string' ? [item['domain']] : [])
    return domains.length > 0 ? domains : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

type UserLocation = {
    type: 'approximate'
    city?: string
    region?: string
    country?: string
    timezone?: string
}

type BuildWebSearchConfigParams = {
    provider: AIProviderName
    model: string
    webSearchEnabled: boolean
    webSearchOptions: Record<string, unknown> | undefined
}

export type WebSearchConfig = {
    tools: ToolSet | undefined
    providerOptions: SharedV3ProviderOptions | undefined
    maxUses: number
}
