import { WebSearchResult } from '@activepieces/server-utils'
import { ToolExecutionOptions } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TaintState } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/tool-primitives'
import { createProviderSearchTools } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/web-media-tools'

describe('ap_web_search over the provider\'s own search', () => {
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('gives up on a slow search with a result the agent can carry on from', async () => {
        vi.useFakeTimers()
        vi.spyOn(AbortSignal, 'timeout').mockImplementation(fakeTimeoutSignal)
        const pending = runSearch({ search: hangUntilAborted, taintState: { tainted: false } })

        await vi.advanceTimersByTimeAsync(45_000)

        expect(await pending).toEqual({ content: [{ type: 'text', text: expect.stringMatching(/^Web search failed: no answer within 45 seconds/) }] })
    })

    it('taints the turn before the model sees a single result', async () => {
        const taintState: TaintState = { tainted: false }

        await runSearch({ search: async () => FOUND, taintState })

        expect(taintState.tainted).toBe(true)
    })

    it('returns the answer and its sources for the query', async () => {
        const result = await runSearch({ search: async () => FOUND, taintState: { tainted: false } })

        expect(result).toEqual({ query: 'activepieces pricing', answer: FOUND.text, results: FOUND.sources })
    })

    it('marks a search on the managed key as already billed at cost', async () => {
        const result = await runSearch({ search: async () => FOUND, taintState: { tainted: false }, billedAtCost: true })

        expect(result).toEqual({ query: 'activepieces pricing', answer: FOUND.text, results: FOUND.sources, billedAtCost: true })
    })

    it('keeps the mark on a failed managed search so it is not billed a flat credit', async () => {
        const result = await runSearch({ search: async () => { throw new Error('provider down') }, taintState: { tainted: false }, billedAtCost: true })

        expect(result).toEqual({ content: [{ type: 'text', text: 'Web search failed: provider down' }], billedAtCost: true })
    })

    it('keeps the mark when an oversized result is truncated', async () => {
        const result = await runSearch({ search: async () => ({ text: 'x'.repeat(300_000), sources: [] }), taintState: { tainted: false }, billedAtCost: true })

        expect(result).toMatchObject({ billedAtCost: true })
        expect(result).not.toHaveProperty('answer')
    })

    it('reports a failed search as a result and still taints', async () => {
        const taintState: TaintState = { tainted: false }

        const result = await runSearch({ search: async () => { throw new Error('provider down') }, taintState })

        expect(result).toEqual({ content: [{ type: 'text', text: 'Web search failed: provider down' }] })
        expect(taintState.tainted).toBe(true)
    })
})

function fakeTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms)
    return controller.signal
}

function hangUntilAborted({ abortSignal }: { abortSignal: AbortSignal }): Promise<WebSearchResult> {
    return new Promise((_resolve, reject) => {
        abortSignal.addEventListener('abort', () => reject(abortSignal.reason))
    })
}

async function runSearch({ search, taintState, billedAtCost = false }: {
    search: (request: { abortSignal: AbortSignal }) => Promise<WebSearchResult>
    taintState: TaintState
    billedAtCost?: boolean
}): Promise<unknown> {
    const execute = createProviderSearchTools({ search, billedAtCost, taintState }).ap_web_search.execute
    if (!execute) {
        throw new Error('ap_web_search has no execute')
    }
    return execute({ query: 'activepieces pricing' }, EXECUTION_OPTIONS)
}

const FOUND: WebSearchResult = {
    text: 'Pricing starts free.',
    sources: [{ url: 'https://www.activepieces.com/pricing', title: 'Pricing' }],
}

const EXECUTION_OPTIONS: ToolExecutionOptions = { toolCallId: 'call-1', messages: [] }
