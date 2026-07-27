import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { chatHelpers } from '../../../../../src/app/ee/chat/chat-helpers'

const resolve = ({ provider, selectedModel }: { provider: AIProviderName, selectedModel: string | null }) =>
    chatHelpers.resolveModelIdForProvider({ provider, selectedModel })

describe('resolveModelIdForProvider', () => {
    it('keeps the tier model id for the activepieces provider', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'fast' })).toBe('anthropic/claude-haiku-4.5')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'premium' })).toBe('anthropic/claude-opus-4.8')
    })

    it('keeps the tier model id for openrouter', () => {
        expect(resolve({ provider: AIProviderName.OPENROUTER, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('honours a model the provider actually offers', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'gemini-2.5-flash' })).toBe('gemini-2.5-flash')
    })

    it('maps a legacy tier id to the provider equivalent when it ships one', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'smart' })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'fast' })).toBe('claude-haiku-4-5')
    })

    it('falls back to the first curated model when the tier has no provider equivalent', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'smart' })).toBe('gemini-2.5-pro')
        // the premium tier runs opus 4.8, which the native anthropic list does not carry
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'premium' })).toBe('claude-sonnet-4-6')
    })

    it('never sends another provider stale selection through', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'claude-sonnet-4-6' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'gpt-5.5' })).toBe('claude-sonnet-4-6')
    })

    it('defaults to the smart tier when nothing is selected', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: null })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: null })).toBe('gpt-5.5')
    })

    it('strips the tier vendor prefix for providers that declare no curated models', () => {
        expect(resolve({ provider: AIProviderName.BEDROCK, selectedModel: 'smart' })).toBe('claude-sonnet-4-6')
    })

    it('resolves the fast round to a model the provider offers', () => {
        expect(chatHelpers.resolveFastModelId({ provider: AIProviderName.ANTHROPIC })).toBe('claude-haiku-4-5')
        expect(chatHelpers.resolveFastModelId({ provider: AIProviderName.OPENAI })).toBe('gpt-5.5')
        expect(chatHelpers.resolveFastModelId({ provider: AIProviderName.ACTIVEPIECES })).toBe('anthropic/claude-haiku-4.5')
    })
})

describe('resolveModelIdForAnalytics', () => {
    const forAnalytics = ({ provider, selectedModel }: { provider: AIProviderName | null, selectedModel: string | null }) =>
        chatHelpers.resolveModelIdForAnalytics({ provider, selectedModel })

    it('reports the model the turn ran on when the provider is known', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1' })).toBe('gpt-4.1')
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
    })

    it('reports nothing when no model was ever selected', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: null })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: null })).toBeNull()
    })

    it('falls back to the tier model id when the provider no longer resolves', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
        expect(forAnalytics({ provider: null, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
    })

    it('never forwards an unrecognised stored value to the analytics sink', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'totally-made-up-model' })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: '<script>alert(1)</script>' })).toBeNull()
    })
})
