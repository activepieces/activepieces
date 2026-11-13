import { AIProviderName } from '@activepieces/core-utils'
import { GetProviderConfigResponse } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockListConfigs, mockGetConfigOrThrow, mockResolveFastModelId } = vi.hoisted(() => ({
    mockListConfigs: vi.fn(),
    mockGetConfigOrThrow: vi.fn(),
    mockResolveFastModelId: vi.fn(),
}))

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({
        listConfigs: mockListConfigs,
        getConfigOrThrow: mockGetConfigOrThrow,
    }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: { resolveFastModelId: mockResolveFastModelId },
}))

const { chosenProviders } = await import('../../../../../src/app/ee/agent/rpc/chosen-providers')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never
const platformId = 'platform-1'
const scope = { type: 'project', projectId: 'project-1' } as const

function credentialsFor({ modelScope, modelIds }: { modelScope: 'all' | 'selected', modelIds: string[] }): GetProviderConfigResponse {
    return { provider: AIProviderName.GOOGLE, configId: 'key-1', platformId, auth: { apiKey: 'k' }, config: {}, modelScope, modelIds }
}

describe('chosenProviders.resolveForRun', () => {
    beforeEach(() => {
        mockListConfigs.mockReset().mockResolvedValue([{ id: 'key-1', provider: AIProviderName.GOOGLE }])
        mockGetConfigOrThrow.mockReset().mockResolvedValue(credentialsFor({ modelScope: 'all', modelIds: [] }))
        mockResolveFastModelId.mockReset().mockResolvedValue('gemini-2.5-flash')
    })

    it('skips every lookup when nothing was chosen', async () => {
        const chosen = await chosenProviders.resolveForRun({ platformId, choices: {}, surface: 'chat', scope, log })

        expect(chosen).toEqual({ search: null, image: null })
        expect(mockListConfigs).not.toHaveBeenCalled()
    })

    it('uses the chosen key and its fast model for search, checked against the run scope', async () => {
        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { webSearch: { aiProviderId: 'key-1' } }, surface: 'chat', scope, log })

        expect(mockGetConfigOrThrow).toHaveBeenCalledWith({ platformId, provider: AIProviderName.GOOGLE, scope, configId: 'key-1' })
        expect(chosen.search).toMatchObject({ credentials: { configId: 'key-1' }, modelId: 'gemini-2.5-flash' })
    })

    it('falls back to the chat provider when the search key has no usable model', async () => {
        mockResolveFastModelId.mockRejectedValue(new Error('no text model'))

        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { webSearch: { aiProviderId: 'key-1' } }, surface: 'chat', scope, log })

        expect(chosen.search).toBeNull()
    })

    it('falls back when the key no longer serves the run\'s project', async () => {
        mockGetConfigOrThrow.mockRejectedValue(new Error('scoped away'))

        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { webSearch: { aiProviderId: 'key-1' }, imageGeneration: { aiProviderId: 'key-1', modelId: 'img-1' } }, surface: 'chat', scope, log })

        expect(chosen).toEqual({ search: null, image: null })
    })

    it('never resolves a key that is not on the platform', async () => {
        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { webSearch: { aiProviderId: 'foreign-key' } }, surface: 'chat', scope, log })

        expect(chosen.search).toBeNull()
        expect(mockGetConfigOrThrow).not.toHaveBeenCalled()
    })

    it('keeps an image model the key still allows', async () => {
        mockGetConfigOrThrow.mockResolvedValue(credentialsFor({ modelScope: 'selected', modelIds: ['img-1'] }))

        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { imageGeneration: { aiProviderId: 'key-1', modelId: 'img-1' } }, surface: 'chat', scope, log })

        expect(chosen.image).toMatchObject({ credentials: { configId: 'key-1' }, modelId: 'img-1' })
    })

    it('keeps any image model on a key that allows every model', async () => {
        mockGetConfigOrThrow.mockResolvedValue(credentialsFor({ modelScope: 'all', modelIds: [] }))

        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { imageGeneration: { aiProviderId: 'key-1', modelId: 'img-1' } }, surface: 'chat', scope, log })

        expect(chosen.image).toMatchObject({ modelId: 'img-1' })
    })

    it('ignores an image choice that names no model', async () => {
        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { imageGeneration: { aiProviderId: 'key-1' } }, surface: 'chat', scope, log })

        expect(chosen.image).toBeNull()
    })

    it('falls back when the saved image model was removed from the key', async () => {
        mockGetConfigOrThrow.mockResolvedValue(credentialsFor({ modelScope: 'selected', modelIds: ['img-2'] }))

        const chosen = await chosenProviders.resolveForRun({ platformId, choices: { imageGeneration: { aiProviderId: 'key-1', modelId: 'img-1' } }, surface: 'chat', scope, log })

        expect(chosen.image).toBeNull()
    })
})
