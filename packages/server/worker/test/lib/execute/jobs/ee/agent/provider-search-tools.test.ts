import { WebSearchResult } from '@activepieces/server-utils'
import { ToolExecutionOptions } from 'ai'
import { describe, expect, it } from 'vitest'
import { TaintState } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/tool-primitives'
import { createProviderSearchTools } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/web-media-tools'

describe('ap_web_search over the provider\'s own search', () => {
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

    it('reports a failed search as a result and still taints', async () => {
        const taintState: TaintState = { tainted: false }

        const result = await runSearch({ search: async () => { throw new Error('provider down') }, taintState })

        expect(result).toEqual({ content: [{ type: 'text', text: 'Web search failed: provider down' }] })
        expect(taintState.tainted).toBe(true)
    })
})

async function runSearch({ search, taintState, billedAtCost = false }: {
    search: () => Promise<WebSearchResult>
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
