import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { cloudApiFetch } from './cloud-api-fetch'

const REGISTRY_URL = 'https://cloud.example.test/api/v1/pieces/registry'

function stubFetch(steps: Step[]): ReturnType<typeof spyOn> {
    let call = 0
    return spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
        const step = steps[Math.min(call, steps.length - 1)]
        call++
        if (step === 'hang') {
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
            })
        }
        if (step instanceof Error) {
            throw step
        }
        if (step === 'body-drops') {
            return new Response(new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('[{"name":"@activepieces/piece-'))
                    controller.error(new TypeError('terminated'))
                },
            }), { status: 200 })
        }
        return new Response(step.body ?? null, { status: step.status })
    })
}

afterEach(() => {
    mock.restore()
})

describe('fetchWithRetry', () => {
    it('returns a 200 on the first try without retrying', async () => {
        const fetchSpy = stubFetch([{ status: 200, body: '[]' }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, baseDelayMs: 1 })
        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('retries a Cloudflare 502 and returns the next 200', async () => {
        const fetchSpy = stubFetch([{ status: 502, body: '<!DOCTYPE html>' }, { status: 200, body: '[]' }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, baseDelayMs: 1 })
        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('retries 520, 522, 504, 429 and 408', async () => {
        const fetchSpy = stubFetch([{ status: 520 }, { status: 522 }, { status: 504 }, { status: 429 }, { status: 408 }, { status: 200 }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, maxAttempts: 6, baseDelayMs: 1 })
        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(6)
    })

    it('retries a network error', async () => {
        const fetchSpy = stubFetch([new TypeError('fetch failed', { cause: new Error('ECONNRESET') }), { status: 404 }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, baseDelayMs: 1 })
        expect(response.status).toBe(404)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('retries a request that hangs past the timeout', async () => {
        const fetchSpy = stubFetch(['hang', { status: 200 }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, baseDelayMs: 1, timeoutMs: 20 })
        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('retries when the connection drops while the body downloads', async () => {
        const fetchSpy = stubFetch(['body-drops', { status: 200, body: '[{"name":"@activepieces/piece-gmail","version":"0.1.0"}]' }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, baseDelayMs: 1 })
        expect(await response.json()).toEqual([{ name: '@activepieces/piece-gmail', version: '0.1.0' }])
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('does not retry a 409', async () => {
        const fetchSpy = stubFetch([{ status: 409, body: 'exists' }])
        const response = await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, init: { method: 'POST', body: '{}' }, baseDelayMs: 1 })
        expect(response.status).toBe(409)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('sends the same method, headers and body on every attempt', async () => {
        const fetchSpy = stubFetch([{ status: 502 }, { status: 200 }])
        const init = { method: 'POST', headers: { 'api-key': 'k' }, body: '{"name":"x"}' }
        await cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, init, baseDelayMs: 1 })
        for (const [, sentInit] of fetchSpy.mock.calls) {
            expect(sentInit).toMatchObject(init)
        }
    })

    it('throws a one-line error without the response body after the last attempt', async () => {
        const fetchSpy = stubFetch([{ status: 502, body: '<!DOCTYPE html><html>bad gateway</html>' }])
        await expect(cloudApiFetch.fetchWithRetry({ url: REGISTRY_URL, maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(`[cloudApiFetch] GET ${REGISTRY_URL} failed after 3 attempts: status=502`)
        expect(fetchSpy).toHaveBeenCalledTimes(3)
    })
})

type Step = { status: number, body?: string } | Error | 'hang' | 'body-drops'
