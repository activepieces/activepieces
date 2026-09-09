import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { aiUtils, WebSearchOptions } from '../src/ai-utils'

function anthropicSearchArgs(options: WebSearchOptions): Record<string, unknown> {
    const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC, auth: { apiKey: 'key' }, options })
    return toArgs(tools['web_search'])
}

function toArgs(tool: unknown): Record<string, unknown> {
    const args = (tool as { args?: Record<string, unknown> } | undefined)?.args
    return args ?? {}
}

describe('aiUtils.buildWebSearchTools', () => {
    it('defaults to five uses when the caller passes no options, as the agent does', () => {
        const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC, auth: { apiKey: 'key' } })
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
            auth: { apiKey: 'key' },
            options: { searchContextSize: 'high', userLocationCountry: 'JO' },
        })
        expect(toArgs(tools['web_search_preview']))
            .toEqual({ searchContextSize: 'high', userLocation: { type: 'approximate', country: 'JO' } })
    })

    it('follows a Cloudflare Gateway model to the provider that actually serves it', () => {
        const tools = aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            auth: { apiKey: 'key' },
            options: { maxUses: 3 },
        })
        expect(toArgs(tools['web_search'])).toEqual({ maxUses: 3 })
    })

    it('returns no tools for a Cloudflare Gateway model whose submodel has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
            auth: { apiKey: 'key' },
        })).toEqual({})
    })

    it('returns no tools for a provider that has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.MISTRAL, auth: { apiKey: 'key' } })).toEqual({})
    })
})

describe('aiUtils.buildWebSearchToolsOrThrow', () => {
    it('fails the way the piece does when the provider has no web search', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, auth: { apiKey: 'key' }, webSearchEnabled: true }))
            .toThrow('Provider azure is not supported for web search')
    })

    it('fails on a Cloudflare Gateway model whose submodel has no web search, naming the gateway as the piece does', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
            auth: { apiKey: 'key' },
            webSearchEnabled: true,
        })).toThrow('Provider cloudflare-gateway is not supported for web search')
    })

    it('returns no tools without throwing for a plugin provider, which searches through the model instead', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.ACTIVEPIECES, auth: { apiKey: 'key' }, webSearchEnabled: true })).toEqual({})
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'key' }, webSearchEnabled: true })).toEqual({})
    })

    it('builds the same tool as the total variant when the provider is supported', () => {
        const strict = aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            auth: { apiKey: 'key' },
            webSearchEnabled: true,
            options: { maxUses: 3 },
        })
        expect(toArgs(strict['web_search'])).toEqual({ maxUses: 3 })
    })

    it('stays silent for an unsupported provider when web search is switched off', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, auth: { apiKey: 'key' }, webSearchEnabled: false })).toEqual({})
    })
})
