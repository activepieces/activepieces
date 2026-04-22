import { AIProviderName, getEffectiveProviderAndModel } from '../../src/lib/management/ai-providers'

describe('getEffectiveProviderAndModel', () => {
    describe('direct providers', () => {
        it('returns openai unchanged', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.OPENAI, model: 'gpt-4' }))
                .toEqual({ provider: AIProviderName.OPENAI, model: 'gpt-4' })
        })

        it('returns anthropic unchanged', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-sonnet' }))
                .toEqual({ provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-sonnet' })
        })

        it('returns google unchanged', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.GOOGLE, model: 'gemini-2.5-flash' }))
                .toEqual({ provider: AIProviderName.GOOGLE, model: 'gemini-2.5-flash' })
        })

        it('returns undefined provider unchanged', () => {
            expect(getEffectiveProviderAndModel({ provider: undefined, model: 'gpt-4' }))
                .toEqual({ provider: undefined, model: 'gpt-4' })
        })
    })

    describe('cloudflare-gateway submodels', () => {
        it('maps openai/* submodel to OPENAI and strips the prefix', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'openai/gpt-4' }))
                .toEqual({ provider: AIProviderName.OPENAI, model: 'gpt-4' })
        })

        it('maps OpenAI/* submodel to OPENAI (case-insensitive provider prefix)', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'OpenAI/gpt-4' }))
                .toEqual({ provider: AIProviderName.OPENAI, model: 'gpt-4' })
        })

        it('maps anthropic/* submodel to ANTHROPIC and strips the prefix', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'anthropic/claude-3-5-sonnet' }))
                .toEqual({ provider: AIProviderName.ANTHROPIC, model: 'claude-3-5-sonnet' })
        })

        it('maps google-ai-studio/* submodel to GOOGLE', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'google-ai-studio/gemini-2.5-flash' }))
                .toEqual({ provider: AIProviderName.GOOGLE, model: 'gemini-2.5-flash' })
        })

        it('maps google-vertex-ai submodel to GOOGLE (leaves publisher/model as the effective model)', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'google-vertex-ai/google/gemini-2.5-pro' }))
                .toEqual({ provider: AIProviderName.GOOGLE, model: 'gemini-2.5-pro' })
        })
    })

    describe('cloudflare-gateway fallbacks', () => {
        it('returns raw cloudflare-gateway for unknown submodel prefixes', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'deepseek/deepseek-chat' }))
                .toEqual({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'deepseek/deepseek-chat' })
        })

        it('returns raw cloudflare-gateway when model is missing', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: undefined }))
                .toEqual({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: undefined })
        })

        it('returns raw cloudflare-gateway when model has no slash', () => {
            expect(getEffectiveProviderAndModel({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'gpt-4' }))
                .toEqual({ provider: AIProviderName.CLOUDFLARE_GATEWAY, model: 'gpt-4' })
        })
    })
})
