import { AIProviderName, ActivepiecesAiBilling, ActivepiecesAiBillingScope, ActivepiecesAiCostEvent } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const BILLING: ActivepiecesAiBilling = { scope: ActivepiecesAiBillingScope.PROJECT, platformId: 'platform-1', projectId: 'project-1' }
const EMBEDDING_MODEL_ID = 'openai/text-embedding-3-small'

function embeddingResponse(body: Record<string, unknown>, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function priced(cost: number): Record<string, unknown> {
    return { id: 'gen-1', usage: { cost, prompt_tokens: 42 } }
}

async function loadCost(): Promise<typeof import('../src/activepieces-ai-cost')['activepiecesAiCost']> {
    vi.resetModules()
    const { activepiecesAiCost } = await import('../src/activepieces-ai-cost')
    return activepiecesAiCost
}

async function embedOnce({ activepiecesAiCost, body, provider = AIProviderName.ACTIVEPIECES, status = 200 }: {
    activepiecesAiCost: Awaited<ReturnType<typeof loadCost>>
    body: Record<string, unknown>
    provider?: AIProviderName
    status?: number
}): Promise<void> {
    const inner = vi.fn(async () => embeddingResponse(body, status))
    const observed = activepiecesAiCost.observedEmbeddingFetch({ provider, modelId: EMBEDDING_MODEL_ID, billing: BILLING, inner })
    await observed?.('https://openrouter.ai/api/v1/embeddings', { method: 'POST' })
    await new Promise((resolve) => setImmediate(resolve))
}

describe('activepiecesAiCost — when nobody installed a reporter', () => {
    it('starts with no reporter, so a missing boot wiring is visible rather than assumed', async () => {
        const activepiecesAiCost = await loadCost()

        expect(activepiecesAiCost.hasReporter()).toBe(false)
    })

    it('counts a priced call it could not report, so lost revenue is measurable', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: priced(0.25) })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(1)
    })

    it('keeps counting, so a process that was never wired up does not look like one dropped call', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: priced(0.25) })
        await embedOnce({ activepiecesAiCost, body: priced(0.5) })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(2)
    })

    it('still returns the response, so a billing gap never breaks the caller', async () => {
        const activepiecesAiCost = await loadCost()
        const inner = vi.fn(async () => embeddingResponse(priced(0.25)))

        const observed = activepiecesAiCost.observedEmbeddingFetch({ provider: AIProviderName.ACTIVEPIECES, modelId: EMBEDDING_MODEL_ID, billing: BILLING, inner })
        const response = await observed?.('https://openrouter.ai/api/v1/embeddings', { method: 'POST' })

        expect(response?.ok).toBe(true)
        expect(await response?.json()).toMatchObject({ id: 'gen-1' })
    })

    it('counts nothing for a call that carried no cost, which is not a lost charge', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: { id: 'gen-1', usage: { prompt_tokens: 42 } } })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(0)
    })

    it('counts nothing for a BYOK provider, which we never pay for', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: priced(0.25), provider: AIProviderName.OPENAI })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(0)
    })

    it('refuses to finish booting, which is what stops a process from serving calls it cannot bill', async () => {
        const activepiecesAiCost = await loadCost()

        expect(() => activepiecesAiCost.assertReporterInstalled()).toThrow(/unbilled/)
    })

    it('counts nothing when the provider call itself failed', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: { error: 'rate limited' }, status: 429 })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(0)
    })
})

describe('activepiecesAiCost — once a reporter is installed', () => {
    let events: ActivepiecesAiCostEvent[]

    beforeEach(() => {
        events = []
    })

    it('reports the observed cost instead of counting it as lost', async () => {
        const activepiecesAiCost = await loadCost()
        activepiecesAiCost.setReporter((event) => events.push(event))

        await embedOnce({ activepiecesAiCost, body: priced(0.25) })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(0)
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
            provider: AIProviderName.ACTIVEPIECES,
            modelId: EMBEDDING_MODEL_ID,
            billing: BILLING,
            call: { generationId: 'gen-1', costUsd: 0.25, inputTokens: 42 },
        })
    })

    it('says a reporter is installed, which is what a boot check would assert', async () => {
        const activepiecesAiCost = await loadCost()
        activepiecesAiCost.setReporter((event) => events.push(event))

        expect(activepiecesAiCost.hasReporter()).toBe(true)
    })

    it('lets boot finish, so the invariant only ever fires on a genuinely unwired process', async () => {
        const activepiecesAiCost = await loadCost()
        activepiecesAiCost.setReporter((event) => events.push(event))

        expect(() => activepiecesAiCost.assertReporterInstalled()).not.toThrow()
    })

    it('does not retroactively report the calls that were dropped before it was installed', async () => {
        const activepiecesAiCost = await loadCost()

        await embedOnce({ activepiecesAiCost, body: priced(0.25) })
        activepiecesAiCost.setReporter((event) => events.push(event))
        await embedOnce({ activepiecesAiCost, body: priced(0.5) })

        expect(activepiecesAiCost.unreportedCallCount()).toBe(1)
        expect(events).toHaveLength(1)
        expect(events[0].call.costUsd).toBe(0.5)
    })
})
