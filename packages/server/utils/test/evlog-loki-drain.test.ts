import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DrainContext, WideEvent } from 'evlog'
import { evlogDrains } from '../src/evlog-drains'
import { safeHttp } from '../src/safe-http'
import { AxiosError } from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

function makeEvent(overrides: Partial<WideEvent> = {}): WideEvent {
    return {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'info',
        service: 'test-service',
        environment: 'test',
        ...overrides,
    }
}

function makeContext(event: WideEvent): DrainContext {
    return { event }
}

function makeHttpError(status: number): AxiosError {
    return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse)
}

function makeHttpClient(postFn = vi.fn().mockResolvedValue({ status: 204 })): AxiosInstance {
    return { post: postFn } as unknown as AxiosInstance
}

describe('evlogDrains.createLokiDrain', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('sends a batch with correct stream structure', async () => {
        const postFn = vi.fn().mockResolvedValue({ status: 204 })
        const client = makeHttpClient(postFn)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'my-service',
            httpClient: client,
        })

        const event = makeEvent({ level: 'info', msg: 'hello' } as Partial<WideEvent> & { msg: string })
        await drain([makeContext(event)])

        expect(postFn).toHaveBeenCalledOnce()
        const [path, body] = postFn.mock.calls[0]
        expect(path).toBe('http://loki:3100/loki/api/v1/push')
        expect(body.streams).toHaveLength(1)
        expect(body.streams[0].stream).toMatchObject({ service: 'my-service', level: 'info' })
        expect(body.streams[0].values).toHaveLength(1)
        const [nanos, payload] = body.streams[0].values[0]
        // nanoseconds string
        expect(typeof nanos).toBe('string')
        expect(BigInt(nanos)).toBeGreaterThan(0n)
        // payload is JSON stringified event
        const parsed = JSON.parse(payload)
        expect(parsed.level).toBe('info')
    })

    it('groups events by level into separate streams', async () => {
        const postFn = vi.fn().mockResolvedValue({ status: 204 })
        const client = makeHttpClient(postFn)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: client,
        })

        const batch = [
            makeContext(makeEvent({ level: 'info' })),
            makeContext(makeEvent({ level: 'error' })),
            makeContext(makeEvent({ level: 'info' })),
        ]

        await drain(batch)

        expect(postFn).toHaveBeenCalledOnce()
        const { streams } = postFn.mock.calls[0][1]
        const infoStream = streams.find((s: { stream: { level: string } }) => s.stream.level === 'info')
        const errorStream = streams.find((s: { stream: { level: string } }) => s.stream.level === 'error')
        expect(infoStream.values).toHaveLength(2)
        expect(errorStream.values).toHaveLength(1)
    })

    it('does not call HTTP on empty batch', async () => {
        const postFn = vi.fn()
        const client = makeHttpClient(postFn)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: client,
        })

        await drain([])
        expect(postFn).not.toHaveBeenCalled()
    })

    it('rejects on HTTP failure so the pipeline can retry the batch', async () => {
        const postFn = vi.fn().mockRejectedValue(new Error('network error'))
        const client = makeHttpClient(postFn)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: client,
        })

        await expect(drain([makeContext(makeEvent())])).rejects.toThrow('network error')
    })

    it.each([408, 429, 503])('rejects on a retryable %i response so the pipeline can retry the batch', async (status) => {
        const postFn = vi.fn().mockRejectedValue(makeHttpError(status))

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: makeHttpClient(postFn),
        })

        await expect(drain([makeContext(makeEvent())])).rejects.toThrow(`status code ${status}`)
    })

    it('logs and resolves when Loki rejects the batch with a 4xx response', async () => {
        const postFn = vi.fn().mockRejectedValue(makeHttpError(400))
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: makeHttpClient(postFn),
        })

        await expect(drain([makeContext(makeEvent())])).resolves.toBeUndefined()
        expect(consoleSpy).toHaveBeenCalledOnce()
        expect(consoleSpy.mock.calls[0][0]).toContain('[evlog-loki] dropped 1 events')

        consoleSpy.mockRestore()
    })

    it('uses nanosecond timestamps derived from event.timestamp', async () => {
        const postFn = vi.fn().mockResolvedValue({ status: 204 })
        const client = makeHttpClient(postFn)

        const drain = evlogDrains.createLokiDrain({
            url: 'http://loki:3100',
            serviceName: 'svc',
            httpClient: client,
        })

        const ts = '2024-06-01T12:00:00.000Z'
        await drain([makeContext(makeEvent({ timestamp: ts }))])

        const { streams } = postFn.mock.calls[0][1]
        const [nanos] = streams[0].values[0]
        const expectedMs = Date.parse(ts)
        expect(BigInt(nanos)).toBe(BigInt(expectedMs) * 1000000n)
    })
})

describe('evlogDrains.resolve', () => {
    it('returns no drain when no config provided', () => {
        const result = evlogDrains.resolve({
            config: { serviceName: 'svc' },
        })
        expect(result.drain).toBeUndefined()
        expect(result.flush).toBeTypeOf('function')
    })

    it('flush resolves when no drain is active', async () => {
        const result = evlogDrains.resolve({ config: { serviceName: 'svc' } })
        await expect(result.flush()).resolves.toBeUndefined()
    })

    it('returns a drain pipeline when lokiUrl is provided', () => {
        const result = evlogDrains.resolve({
            config: { serviceName: 'svc', lokiUrl: 'http://loki:3100' },
        })
        expect(result.drain).toBeTypeOf('function')
        expect(result.flush).toBeTypeOf('function')
    })

    it('returns a drain pipeline when axiomToken and axiomDataset are provided', () => {
        const result = evlogDrains.resolve({
            config: { serviceName: 'svc', axiomToken: 'xaat-token', axiomDataset: 'logs' },
        })
        expect(result.drain).toBeTypeOf('function')
        expect(result.flush).toBeTypeOf('function')
    })

    it('returns no drain when axiomToken is set but axiomDataset is missing', () => {
        const result = evlogDrains.resolve({
            config: { serviceName: 'svc', axiomToken: 'xaat-token' },
        })
        expect(result.drain).toBeUndefined()
    })
})

describe('evlogDrains.resolve with lokiUrl', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    async function pushAndFlush(postFn: ReturnType<typeof vi.fn>): Promise<void> {
        vi.spyOn(safeHttp, 'createAxios').mockReturnValue(makeHttpClient(postFn))
        const result = evlogDrains.resolve({
            config: { serviceName: 'svc', lokiUrl: 'http://loki:3100' },
        })
        await result.drain?.(makeContext(makeEvent()))
        const flushed = result.flush()
        await vi.runAllTimersAsync()
        await flushed
    }

    it('retries a batch after a transient push failure', async () => {
        const postFn = vi.fn()
            .mockRejectedValueOnce(makeHttpError(503))
            .mockResolvedValueOnce({ status: 204 })
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await pushAndFlush(postFn)

        expect(postFn).toHaveBeenCalledTimes(2)
        expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('reports dropped events after exhausting retries', async () => {
        const postFn = vi.fn().mockRejectedValue(makeHttpError(503))
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await pushAndFlush(postFn)

        expect(postFn).toHaveBeenCalledTimes(3)
        expect(consoleSpy).toHaveBeenCalledWith('[evlog-pipeline] dropped 1 events', 'Request failed with status code 503')
    })

    it('does not retry a batch Loki rejects with a 4xx response', async () => {
        const postFn = vi.fn().mockRejectedValue(makeHttpError(400))
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await pushAndFlush(postFn)

        expect(postFn).toHaveBeenCalledOnce()
        expect(consoleSpy).toHaveBeenCalledOnce()
        expect(consoleSpy.mock.calls[0][0]).toContain('[evlog-loki] dropped 1 events')
    })
})
