import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WAITER_TIMEOUT_MS } from '../../../../../src/app/workers/job-queue/queue-timing'
import { stoppingConnections } from '../../../../../src/app/workers/job-queue/stopping-connections'

describe('stoppingConnections', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        stoppingConnections.reset()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('keeps a connection marked for longer than a poll can wait in the dispatcher', () => {
        stoppingConnections.mark('socket-1')
        vi.advanceTimersByTime(WAITER_TIMEOUT_MS + 1_000)
        expect(stoppingConnections.isStopping('socket-1')).toBe(true)
    })

    it('forgets the connection once no poll it sent can still return', () => {
        stoppingConnections.mark('socket-1')
        vi.advanceTimersByTime(WAITER_TIMEOUT_MS + 10_001)
        expect(stoppingConnections.isStopping('socket-1')).toBe(false)
    })

    it('marks only the connection that is stopping', () => {
        stoppingConnections.mark('socket-1')
        expect(stoppingConnections.isStopping('socket-2')).toBe(false)
        expect(stoppingConnections.isStopping(undefined)).toBe(false)
    })
})

describe('holdForConnection', () => {
    beforeEach(() => {
        stoppingConnections.reset()
    })

    it('returns a dequeued job to the queue when the worker has started to stop', async () => {
        stoppingConnections.mark('socket-1')
        const job = { jobId: 'job-1' }
        const release = vi.fn(async () => undefined)
        const record = vi.fn()

        const delivered = await stoppingConnections.holdForConnection({
            connectionId: 'socket-1',
            job,
            release,
            record,
        })

        expect(delivered).toBeNull()
        expect(release).toHaveBeenCalledWith(job)
        expect(record).not.toHaveBeenCalled()
    })

    it('does not release when the stopping worker was given no job', async () => {
        stoppingConnections.mark('socket-1')
        const release = vi.fn(async () => undefined)

        const delivered = await stoppingConnections.holdForConnection({
            connectionId: 'socket-1',
            job: null,
            release,
            record: vi.fn(),
        })

        expect(delivered).toBeNull()
        expect(release).not.toHaveBeenCalled()
    })

    it('records and delivers a job for a worker that is still polling', async () => {
        const job = { jobId: 'job-1' }
        const release = vi.fn(async () => undefined)
        const record = vi.fn()

        const delivered = await stoppingConnections.holdForConnection({
            connectionId: 'socket-1',
            job,
            release,
            record,
        })

        expect(delivered).toBe(job)
        expect(record).toHaveBeenCalledWith({ job, connectionId: 'socket-1' })
        expect(release).not.toHaveBeenCalled()
    })

    it('delivers a job without recording it when the poll has no connection', async () => {
        const job = { jobId: 'job-1' }
        const record = vi.fn()

        const delivered = await stoppingConnections.holdForConnection({
            connectionId: undefined,
            job,
            release: vi.fn(async () => undefined),
            record,
        })

        expect(delivered).toBe(job)
        expect(record).not.toHaveBeenCalled()
    })
})
