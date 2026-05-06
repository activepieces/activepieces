import { createFlowsContext } from '../../src/lib/piece-context/flows'

const FLOWS_PARAMS = {
    engineToken: 'test-token',
    internalApiUrl: 'http://localhost:3000/',
    flowId: 'flow-123',
    flowVersionId: 'version-123',
}

describe('flows service', () => {

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('appends each external flow id as a separate query param', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ data: [], next: null, previous: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const flows = createFlowsContext(FLOWS_PARAMS)
        await flows.list({ externalIds: ['flow-a', 'flow-b'] })

        const calledUrl = fetchSpy.mock.calls[0][0].toString()
        expect(calledUrl).toContain('externalIds=flow-a')
        expect(calledUrl).toContain('externalIds=flow-b')
        expect(calledUrl).not.toContain('externalIds=flow-a%2Cflow-b')
    })
})
