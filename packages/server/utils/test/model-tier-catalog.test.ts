import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('../src/safe-http', () => ({
    safeHttp: {
        get retryingAxios() {
            return { get }
        },
    },
}))

const FAST = { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', thinkingBudget: 5_000 }
const SMART = { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', thinkingBudget: 10_000 }
const CHAT_SMART = { id: 'smart', label: 'Expert', modelId: 'openai/gpt-5.5', thinkingBudget: 10_000 }
const DEEP = { id: 'deep', label: 'Deep', modelId: 'anthropic/claude-opus-4.8', thinkingBudget: 20_000 }

const FLOW_ONLY = {
    version: 3,
    publishedAt: '2026-09-26T00:00:00.000Z',
    publishedBy: 'ops@activepieces.com',
    tiers: [FAST, SMART],
    defaultTierId: 'smart',
}

const BOTH_LISTS = {
    ...FLOW_ONLY,
    chatTiers: [FAST, CHAT_SMART, DEEP],
    chatDefaultTierId: 'deep',
}

const BUNDLED_IDS = ACTIVEPIECES_CHAT_TIERS.map((tier) => tier.id)

async function freshCatalog(): Promise<typeof import('../src/model-tier-catalog').modelTierCatalog> {
    vi.resetModules()
    const { modelTierCatalog } = await import('../src/model-tier-catalog')
    return modelTierCatalog
}

async function warmedCatalog(file: unknown): Promise<typeof import('../src/model-tier-catalog').modelTierCatalog> {
    get.mockResolvedValue({ data: file })
    const catalog = await freshCatalog()
    await catalog.warmUp()
    return catalog
}

function ids(tiers: { id: string }[]): string[] {
    return tiers.map((tier) => tier.id)
}

describe('modelTierCatalog', () => {
    beforeEach(() => {
        get.mockReset()
        process.env['AP_MODEL_TIERS_URL'] = 'https://tiers.test/pricing.json'
    })

    afterEach(() => {
        vi.useRealTimers()
        delete process.env['AP_MODEL_TIERS_URL']
    })

    it('serves the flow list and the chat list from one file, each with its own default', async () => {
        const catalog = await warmedCatalog(BOTH_LISTS)

        expect(ids(catalog.current('flow').tiers)).toEqual(['fast', 'smart'])
        expect(catalog.current('flow').defaultTierId).toBe('smart')
        expect(ids(catalog.current('chat').tiers)).toEqual(['fast', 'smart', 'deep'])
        expect(catalog.current('chat').defaultTierId).toBe('deep')
        expect(get).toHaveBeenCalledWith('https://tiers.test/pricing.json', expect.anything())
    })

    it('lets the same tier id point at different models on the two lists', async () => {
        const catalog = await warmedCatalog(BOTH_LISTS)

        expect(catalog.current('flow').resolveTier({ tierId: 'smart' }).modelId).toBe('anthropic/claude-sonnet-4.6')
        expect(catalog.current('chat').resolveTier({ tierId: 'smart' }).modelId).toBe('openai/gpt-5.5')
    })

    it('reads the flow list for chat when the file has no chat keys', async () => {
        const catalog = await warmedCatalog(FLOW_ONLY)

        expect(catalog.current('chat')).toBe(catalog.current('flow'))
    })

    it('points the fast tier at "fast" unless the file says otherwise', async () => {
        const catalog = await warmedCatalog({ ...BOTH_LISTS, fastTierId: 'smart' })

        expect(catalog.current('flow').fastTierId).toBe('smart')
        expect(catalog.current('chat').fastTierId).toBe('fast')
    })

    it('resolves an unknown or missing tier id to the default of that surface', async () => {
        const catalog = await warmedCatalog(BOTH_LISTS)

        expect(catalog.current('chat').resolveTier({ tierId: 'does-not-exist' }).id).toBe('deep')
        expect(catalog.current('chat').resolveTier({ tierId: undefined }).id).toBe('deep')
        expect(catalog.current('flow').resolveTier({ tierId: null }).id).toBe('smart')
        expect(catalog.current('flow').findTier({ tierId: 'does-not-exist' })).toBeUndefined()
    })

    it('serves the tiers shipped with the release when the fetch fails, and still finishes warm-up', async () => {
        get.mockRejectedValue(new Error('network is down'))
        const catalog = await freshCatalog()

        await expect(catalog.warmUp()).resolves.toBeUndefined()
        expect(ids(catalog.current('flow').tiers)).toEqual(BUNDLED_IDS)
        expect(catalog.current('flow').defaultTierId).toBe(DEFAULT_CHAT_TIER_ID)
        expect(catalog.current('chat')).toBe(catalog.current('flow'))
    })

    it('finishes warm-up within two seconds when the CDN hangs', async () => {
        vi.useFakeTimers()
        get.mockReturnValue(new Promise(() => undefined))
        const catalog = await freshCatalog()

        const warmUp = catalog.warmUp()
        await vi.advanceTimersByTimeAsync(2_000)

        await expect(warmUp).resolves.toBeUndefined()
        expect(ids(catalog.current('flow').tiers)).toEqual(BUNDLED_IDS)
    })

    it.each([
        ['default tier missing from its list', { ...FLOW_ONLY, defaultTierId: 'nope' }],
        ['no tiers at all', { ...FLOW_ONLY, tiers: [] }],
        ['duplicate id within one list', { ...FLOW_ONLY, tiers: [FAST, { ...SMART, id: 'fast' }] }],
        ['fast pointer missing from its list', { ...FLOW_ONLY, fastTierId: 'nope' }],
        ['no "fast" tier and no fast pointer', { ...FLOW_ONLY, tiers: [SMART] }],
        ['chat list without a chat default', { ...FLOW_ONLY, chatTiers: [FAST, DEEP] }],
        ['chat default without a chat list', { ...FLOW_ONLY, chatDefaultTierId: 'smart' }],
        ['chat default missing from the chat list', { ...BOTH_LISTS, chatDefaultTierId: 'smart-er' }],
        ['chat fast pointer missing from the chat list', { ...BOTH_LISTS, chatFastTierId: 'nope' }],
    ])('rejects a file whole when it has a %s', async (_, file) => {
        const catalog = await warmedCatalog(file)

        expect(ids(catalog.current('flow').tiers)).toEqual(BUNDLED_IDS)
        expect(ids(catalog.current('chat').tiers)).toEqual(BUNDLED_IDS)
    })

    it('ignores the keys an older console still publishes', async () => {
        const catalog = await warmedCatalog({ ...BOTH_LISTS, modelWeights: { 'openai/gpt-4': 999 }, unpricedModelCreditWeight: 250 })

        expect(catalog.current('flow').resolveTier({ tierId: 'fast' }).modelId).toBe('anthropic/claude-haiku-4.5')
        expect(Object.keys(catalog.current('flow').tiers[0])).toEqual(['id', 'label', 'modelId', 'thinkingBudget'])
    })

    it('answers synchronously with the bundled tiers before the first fetch lands, then switches to the file', async () => {
        let release: (value: { data: unknown }) => void = () => undefined
        get.mockReturnValue(new Promise<{ data: unknown }>((resolve) => {
            release = resolve
        }))
        const catalog = await freshCatalog()

        const beforeFetch = catalog.current('flow')
        expect(ids(beforeFetch.tiers)).toEqual(BUNDLED_IDS)
        expect(catalog.current('flow')).toBe(beforeFetch)
        expect(get).toHaveBeenCalledTimes(1)

        release({ data: BOTH_LISTS })
        await vi.waitFor(() => expect(ids(catalog.current('flow').tiers)).toEqual(['fast', 'smart']))
        expect(catalog.current('flow')).toBe(catalog.current('flow'))
        expect(catalog.current('flow')).not.toBe(beforeFetch)
    })

    it('refreshes in the background after 15 minutes and backs off for 5 minutes after a failure', async () => {
        const catalog = await warmedCatalog(BOTH_LISTS)
        vi.useFakeTimers()
        expect(get).toHaveBeenCalledTimes(1)

        catalog.current('flow')
        expect(get).toHaveBeenCalledTimes(1)

        vi.setSystemTime(Date.now() + 16 * 60_000)
        catalog.current('flow')
        catalog.current('chat')
        expect(get).toHaveBeenCalledTimes(2)
        await vi.advanceTimersByTimeAsync(0)

        get.mockRejectedValue(new Error('network is down'))
        vi.setSystemTime(Date.now() + 16 * 60_000)
        catalog.current('flow')
        await vi.advanceTimersByTimeAsync(0)
        expect(get).toHaveBeenCalledTimes(3)
        expect(ids(catalog.current('flow').tiers)).toEqual(['fast', 'smart'])

        vi.setSystemTime(Date.now() + 60_000)
        catalog.current('flow')
        expect(get).toHaveBeenCalledTimes(3)

        vi.setSystemTime(Date.now() + 5 * 60_000)
        catalog.current('flow')
        expect(get).toHaveBeenCalledTimes(4)
    })
})
