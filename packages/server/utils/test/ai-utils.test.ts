import { AIProviderName } from '@activepieces/core-utils'
import { aiProviderCredentials } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { aiUtils, WebSearchOptions } from '../src/ai-utils'

function anthropicSearchArgs(options: WebSearchOptions): Record<string, unknown> {
    const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC, options })
    return toArgs(tools['web_search'])
}

function toArgs(tool: unknown): Record<string, unknown> {
    const args = (tool as { args?: Record<string, unknown> } | undefined)?.args
    return args ?? {}
}

describe('aiUtils.buildWebSearchTools', () => {
    it('defaults to five uses when the caller passes no options, as the agent does', () => {
        const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC })
        expect(toArgs(tools['web_search'])).toEqual({ maxUses: 5 })
    })

    it('drops blocked domains when allowed domains are present, rather than sending both', () => {
        expect(anthropicSearchArgs({
            allowedDomains: [{ domain: 'docs.example.com' }],
            blockedDomains: [{ domain: 'spam.example.com' }],
        })).toEqual({ maxUses: 5, allowedDomains: ['docs.example.com'] })
    })

    it('sends blocked domains when no allowed domains narrow the search', () => {
        expect(anthropicSearchArgs({ blockedDomains: [{ domain: 'spam.example.com' }] }))
            .toEqual({ maxUses: 5, blockedDomains: ['spam.example.com'] })
    })

    it('treats an empty domain list as absent', () => {
        expect(anthropicSearchArgs({ allowedDomains: [], blockedDomains: [{ domain: 'spam.example.com' }] }))
            .toEqual({ maxUses: 5, blockedDomains: ['spam.example.com'] })
    })

    it('builds a partial user location from whichever fields were filled in', () => {
        expect(anthropicSearchArgs({ userLocationCity: 'Amman', userLocationTimezone: 'Asia/Amman' }))
            .toEqual({ maxUses: 5, userLocation: { type: 'approximate', city: 'Amman', timezone: 'Asia/Amman' } })
    })

    it('omits the user location entirely when no location field was filled in', () => {
        expect(anthropicSearchArgs({ maxUses: 2 })).toEqual({ maxUses: 2 })
    })

    it('gives OpenAI the Responses-API preview tool with its own options', () => {
        const tools = aiUtils.buildWebSearchTools({
            provider: AIProviderName.OPENAI,
            options: { searchContextSize: 'high', userLocationCountry: 'JO' },
        })
        expect(toArgs(tools['web_search_preview']))
            .toEqual({ searchContextSize: 'high', userLocation: { type: 'approximate', country: 'JO' } })
    })

    it('follows a Cloudflare Gateway model to the provider that actually serves it', () => {
        const tools = aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            options: { maxUses: 3 },
        })
        expect(toArgs(tools['web_search'])).toEqual({ maxUses: 3 })
    })

    it('returns no tools for a Cloudflare Gateway model whose submodel has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
        })).toEqual({})
    })

    it('returns no tools for a provider that has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.MISTRAL })).toEqual({})
    })

    it('returns no tools for a key-less provider, which can never reach a native search tool', () => {
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.VERTEX })).toEqual({})
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.BEDROCK })).toEqual({})
    })
})

describe('aiUtils.buildWebSearchToolsOrThrow', () => {
    it('fails the way the piece does when the provider has no web search', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, webSearchEnabled: true }))
            .toThrow('Provider azure is not supported for web search')
    })

    it('fails on a Cloudflare Gateway model whose submodel has no web search, naming the gateway as the piece does', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
            webSearchEnabled: true,
        })).toThrow('Provider cloudflare-gateway is not supported for web search')
    })

    it('returns no tools without throwing for a plugin provider, which searches through the model instead', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.ACTIVEPIECES, webSearchEnabled: true })).toEqual({})
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.OPENROUTER, webSearchEnabled: true })).toEqual({})
    })

    it('builds the same tool as the total variant when the provider is supported', () => {
        const strict = aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            webSearchEnabled: true,
            options: { maxUses: 3 },
        })
        expect(toArgs(strict['web_search'])).toEqual({ maxUses: 3 })
    })

    it('stays silent for an unsupported provider when web search is switched off', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, webSearchEnabled: false })).toEqual({})
    })
})

describe('aiUtils.createModelForImages', () => {
    const gatewayConfig = { accountId: 'account', gatewayId: 'gateway' }

    it('builds an image model for a Cloudflare Gateway model, as the piece does', () => {
        const model = aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'key' }, config: gatewayConfig }),
            modelId: 'openai/dall-e-3',
        })

        expect(model).toBeDefined()
    })

    it('builds an image model for a gateway submodel it has no dedicated branch for', () => {
        const model = aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'key' }, config: gatewayConfig }),
            modelId: 'workers-ai/flux',
        })

        expect(model).toBeDefined()
    })

    it('returns nothing for a provider with no image model, so the caller can fall back to text', () => {
        expect(aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.GOOGLE, auth: { apiKey: 'key' }, config: {} }),
            modelId: 'gemini-2.5-flash',
        })).toBeUndefined()
    })
})

describe('what the managed provider is asked to send back', () => {
    function settingsFor({ provider, webSearchEnabled = false }: { provider: AIProviderName, webSearchEnabled?: boolean }): Record<string, unknown> | undefined {
        const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider, auth: { apiKey: 'key' }, config: {} }), modelId: 'anthropic/claude-sonnet-5', webSearchEnabled })
        return (model as unknown as { settings?: Record<string, unknown> }).settings
    }

    it('asks OpenRouter to report what a managed call cost, which is the whole basis of the bill', () => {
        expect(settingsFor({ provider: AIProviderName.ACTIVEPIECES })).toMatchObject({ usage: { include: true } })
    })

    it('keeps asking for the cost when web search is on, rather than letting the plugin setting replace it', () => {
        expect(settingsFor({ provider: AIProviderName.ACTIVEPIECES, webSearchEnabled: true })).toMatchObject({
            usage: { include: true },
            plugins: [{ id: 'web', max_results: 5 }],
        })
    })

    it('does not ask for cost accounting on a customer own OpenRouter key, which we never pay for', () => {
        expect(settingsFor({ provider: AIProviderName.OPENROUTER })).toEqual({})
    })
})
