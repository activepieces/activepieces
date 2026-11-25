import { retryFetch } from '../../src/lib/api/retry-fetch'

describe('retryFetch', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('keeps retrying a 502 for at least 40 seconds before giving up', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response(null, { status: 502 }))
        const start = Date.now()

        const response = await drain(retryFetch('http://localhost:3000/v1/engine/run-logs', { method: 'POST' }))

        expect(response.status).toBe(502)
        expect(fetchSpy).toHaveBeenCalledTimes(8)
        expect(Date.now() - start).toBeGreaterThanOrEqual(40000)
    })

    it('resolves once the API recovers from a deploy gap', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, { status: 502 }))
            .mockResolvedValueOnce(new Response(null, { status: 502 }))
            .mockResolvedValueOnce(new Response(null, { status: 503 }))
            .mockResolvedValue(new Response(null, { status: 200 }))

        const response = await drain(retryFetch('http://localhost:3000/v1/engine/run-logs', { method: 'POST' }))

        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(4)
    })

    it('does not retry a client error', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 400 }))

        const response = await drain(retryFetch('http://localhost:3000/v1/engine/run-logs', { method: 'POST' }))

        expect(response.status).toBe(400)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

async function drain<T>(pending: Promise<T>): Promise<T> {
    pending.catch(() => undefined)
    await vi.runAllTimersAsync()
    return pending
}
