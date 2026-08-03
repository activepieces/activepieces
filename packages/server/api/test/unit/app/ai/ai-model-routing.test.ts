import { ActivepiecesError, AIProviderName } from '@activepieces/core-utils'
import { AiRoutingTiers, GetProviderConfigResponse } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { aiModelRoutingResolution } from '../../../../src/app/ai/ai-model-routing-service'

const slot = (provider: AIProviderName, modelId: string) => ({ provider, modelId })

const tiersWith = (main: AIProviderName, backup: AIProviderName): AiRoutingTiers => {
    const tier = { main: slot(main, 'main-model'), backup1: slot(backup, 'backup-model'), backup2: slot(backup, 'backup-model-2') }
    return { fast: tier, smart: tier, premium: tier }
}

const validationMessageOf = (fn: () => void): string => {
    try {
        fn()
        throw new Error('expected validation to throw')
    }
    catch (e) {
        if (e instanceof ActivepiecesError && 'message' in e.error.params) {
            return String(e.error.params.message)
        }
        throw e
    }
}

describe('validateTiersAgainstProviders', () => {
    const allConfigured = new Set(Object.values(AIProviderName))

    it('accepts a tier whose backups match the main capabilities', () => {
        expect(() => aiModelRoutingResolution.validateTiersAgainstProviders({
            tiers: tiersWith(AIProviderName.OPENAI, AIProviderName.AZURE),
            configuredProviders: allConfigured,
        })).not.toThrow()
    })

    it('rejects a slot whose provider is not configured on the platform', () => {
        expect(validationMessageOf(() => aiModelRoutingResolution.validateTiersAgainstProviders({
            tiers: tiersWith(AIProviderName.OPENAI, AIProviderName.AZURE),
            configuredProviders: new Set([AIProviderName.OPENAI]),
        }))).toMatch(/providerNotConfigured/)
    })

    it('rejects a backup that cannot generate images when the main can', () => {
        expect(validationMessageOf(() => aiModelRoutingResolution.validateTiersAgainstProviders({
            tiers: tiersWith(AIProviderName.OPENAI, AIProviderName.ANTHROPIC),
            configuredProviders: allConfigured,
        }))).toMatch(/capabilityMismatch.imageGeneration/)
    })

    it('rejects a backup without web search when the main has it', () => {
        expect(validationMessageOf(() => aiModelRoutingResolution.validateTiersAgainstProviders({
            tiers: tiersWith(AIProviderName.GOOGLE, AIProviderName.BEDROCK),
            configuredProviders: allConfigured,
        }))).toMatch(/capabilityMismatch.webSearch/)
    })

    it('allows a backup with MORE capabilities than the main', () => {
        expect(() => aiModelRoutingResolution.validateTiersAgainstProviders({
            tiers: tiersWith(AIProviderName.MISTRAL, AIProviderName.OPENROUTER),
            configuredProviders: allConfigured,
        })).not.toThrow()
    })
})

describe('deriveDefaultTiers', () => {
    it('derives single-provider tiers matching todays per-provider resolution', () => {
        const chatProvider: GetProviderConfigResponse = {
            provider: AIProviderName.ANTHROPIC,
            auth: { apiKey: 'k' },
            config: {},
            platformId: 'p',
        }
        const tiers = aiModelRoutingResolution.deriveDefaultTiers({ chatProvider })
        expect(tiers.smart.main).toEqual({ provider: AIProviderName.ANTHROPIC, modelId: 'claude-sonnet-4-6' })
        expect(tiers.fast.main).toEqual({ provider: AIProviderName.ANTHROPIC, modelId: 'claude-haiku-4-5' })
        expect(tiers.smart.backup1).toEqual(tiers.smart.main)
        expect(tiers.smart.backup2).toEqual(tiers.smart.main)
    })

    it('falls back to the managed provider tier models when no chat provider exists', () => {
        const tiers = aiModelRoutingResolution.deriveDefaultTiers({ chatProvider: null })
        expect(tiers.smart.main).toEqual({ provider: AIProviderName.ACTIVEPIECES, modelId: 'anthropic/claude-sonnet-4.6' })
        expect(tiers.premium.main).toEqual({ provider: AIProviderName.ACTIVEPIECES, modelId: 'anthropic/claude-opus-4.8' })
    })
})
