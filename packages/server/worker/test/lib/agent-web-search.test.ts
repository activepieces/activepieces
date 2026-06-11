import { AIProviderName } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { buildWebSearchConfig } from '../../src/lib/ai/agent/tools/web-search'

describe('buildWebSearchConfig', () => {
    it('returns nothing when web search is disabled', () => {
        const result = buildWebSearchConfig({ provider: AIProviderName.OPENAI, model: 'gpt-4o', webSearchEnabled: false, webSearchOptions: undefined })
        expect(result.tools).toBeUndefined()
        expect(result.providerOptions).toBeUndefined()
    })

    it('builds an OpenAI provider-native web search tool', () => {
        const result = buildWebSearchConfig({ provider: AIProviderName.OPENAI, model: 'gpt-4o', webSearchEnabled: true, webSearchOptions: { searchContextSize: 'high' } })
        expect(Object.keys(result.tools ?? {})).toContain('web_search_preview')
        expect(result.providerOptions).toBeUndefined()
    })

    it('builds an Anthropic provider-native web search tool', () => {
        const result = buildWebSearchConfig({
            provider: AIProviderName.ANTHROPIC,
            model: 'claude-sonnet-4',
            webSearchEnabled: true,
            webSearchOptions: { maxUses: 3, allowedDomains: [{ domain: 'example.com' }] },
        })
        expect(Object.keys(result.tools ?? {})).toContain('web_search')
        expect(result.providerOptions).toBeUndefined()
    })

    it('builds a Google provider-native web search tool', () => {
        const result = buildWebSearchConfig({ provider: AIProviderName.GOOGLE, model: 'gemini-2.0-flash', webSearchEnabled: true, webSearchOptions: {} })
        expect(Object.keys(result.tools ?? {})).toContain('google_search')
    })

    it('maps OpenRouter web search to a clamped provider option (no tool)', () => {
        const result = buildWebSearchConfig({ provider: AIProviderName.OPENROUTER, model: 'openai/gpt-4o', webSearchEnabled: true, webSearchOptions: { maxUses: 50 } })
        expect(result.tools).toBeUndefined()
        const plugins = result.providerOptions?.['openrouter']?.['plugins']
        expect(plugins).toEqual([{ id: 'web', max_results: 10 }])
    })

    it('ignores malformed web search options without throwing', () => {
        const result = buildWebSearchConfig({
            provider: AIProviderName.ANTHROPIC,
            model: 'claude-sonnet-4',
            webSearchEnabled: true,
            webSearchOptions: { maxUses: 'not-a-number', allowedDomains: 'not-an-array', userLocationCity: 42 },
        })
        expect(Object.keys(result.tools ?? {})).toContain('web_search')
    })
})
