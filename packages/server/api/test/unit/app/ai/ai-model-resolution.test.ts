import { AIProviderName } from '@activepieces/core-utils'
import { modelTierCatalog } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aiModelResolution } from '../../../../src/app/ai/ai-model-resolution'
import { publishedTierReaders } from '../ee/agent/model-tier-fixture'

const warn = vi.fn()
const log = { info: vi.fn(), warn, error: vi.fn(), debug: vi.fn() } as never

function resolve({ provider = AIProviderName.ACTIVEPIECES, modelId }: { provider?: AIProviderName, modelId: string }): string {
    return aiModelResolution.resolveTierModelId({ provider, modelId, log })
}

beforeEach(() => {
    warn.mockClear()
    vi.spyOn(modelTierCatalog, 'current').mockImplementation((surface) => publishedTierReaders[surface])
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('aiModelResolution.resolveTierModelId', () => {
    it('a tier the release never shipped runs the model the published flow list gives it', () => {
        expect(resolve({ modelId: 'deep' })).toBe('anthropic/claude-fable-5.1')
        expect(modelTierCatalog.current).toHaveBeenCalledWith('flow')
        expect(warn).not.toHaveBeenCalled()
    })

    it('reads the flow list, not the chat list, where the two disagree on smart', () => {
        expect(resolve({ modelId: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('a chat-only tier is unknown on the flow surface and runs the flow default with one warning', () => {
        expect(resolve({ modelId: 'turbo' })).toBe('anthropic/claude-sonnet-4.6')
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalledWith({ tier: { id: 'turbo' }, surface: 'flow' }, expect.stringContaining('no longer published'))
    })

    it('an unknown bare slug runs the flow default and warns once', () => {
        expect(resolve({ modelId: 'tier-9' })).toBe('anthropic/claude-sonnet-4.6')
        expect(warn).toHaveBeenCalledTimes(1)
    })

    it('leaves a managed model id alone: Haiku, not Sonnet, because Sonnet is the default a bare resolveTier would return by accident', () => {
        expect(resolve({ modelId: 'anthropic/claude-haiku-4.5' })).toBe('anthropic/claude-haiku-4.5')
        expect(warn).not.toHaveBeenCalled()
    })

    it('leaves an own-key provider\'s bare slug alone, because only the managed provider stores tiers', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, modelId: 'gpt-5' })).toBe('gpt-5')
        expect(resolve({ provider: AIProviderName.AZURE, modelId: 'smart' })).toBe('smart')
        expect(warn).not.toHaveBeenCalled()
    })

    it('passes an empty model id through so the provider reports it, as today', () => {
        expect(resolve({ modelId: '' })).toBe('')
        expect(warn).not.toHaveBeenCalled()
    })

    it('leaves the AI Router\'s model alone', () => {
        expect(resolve({ modelId: 'typesafe/jev-1.13' })).toBe('typesafe/jev-1.13')
        expect(warn).not.toHaveBeenCalled()
    })
})
