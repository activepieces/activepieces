import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'

const { mockLoad } = vi.hoisted(() => ({ mockLoad: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    modelCatalog: { load: mockLoad },
}))

const { affordableOutputTokens } = await import('../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn')

const catalogOf = (byId: Record<string, number>) => ({
    lookup: ({ modelId }: { modelId: string }) => {
        const stripped = modelId.replace(/^(us|eu|apac|global)\./, '')
        const maxOutputTokens = byId[stripped]
        return maxOutputTokens === undefined ? undefined : { maxOutputTokens }
    },
})

describe('affordableOutputTokens', () => {
    const SMART_TIER_THINKING = 10_000

    it('reads through a region-prefixed Bedrock id, which is how the picker spells them', async () => {
        mockLoad.mockResolvedValue(catalogOf({ 'amazon.nova-pro-v1:0': 10_000 }))

        await expect(affordableOutputTokens({
            provider: AIProviderName.BEDROCK,
            modelIds: ['eu.amazon.nova-pro-v1:0'],
            thinkingBudget: SMART_TIER_THINKING,
        })).resolves.toBe(10_000)
    })

    it('keeps the turn inside the smaller ceiling when the fast round runs a different model', async () => {
        mockLoad.mockResolvedValue(catalogOf({ 'amazon.nova-pro-v1:0': 10_000, 'amazon.nova-micro-v1:0': 5_000 }))

        await expect(affordableOutputTokens({
            provider: AIProviderName.BEDROCK,
            modelIds: ['eu.amazon.nova-pro-v1:0', 'eu.amazon.nova-micro-v1:0'],
            thinkingBudget: SMART_TIER_THINKING,
        })).resolves.toBe(5_000)
    })

    it('leaves the budget alone for a model the catalog has never heard of', async () => {
        mockLoad.mockResolvedValue(catalogOf({}))

        await expect(affordableOutputTokens({
            provider: AIProviderName.BEDROCK,
            modelIds: ['eu.some.brand-new-model-v9:0'],
            thinkingBudget: SMART_TIER_THINKING,
        })).resolves.toBe(42_000)
    })

    it('does not shrink a turn because the catalog was unreachable', async () => {
        mockLoad.mockResolvedValue({ lookup: () => undefined })

        await expect(affordableOutputTokens({
            provider: AIProviderName.BEDROCK,
            modelIds: ['eu.amazon.nova-pro-v1:0', undefined],
            thinkingBudget: SMART_TIER_THINKING,
        })).resolves.toBe(42_000)
    })
})
