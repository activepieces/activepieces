import { beforeEach, describe, expect, it, vi } from 'vitest'
import { holdForConnection, stoppingConnections } from '../../../../../src/app/workers/job-queue/stopping-connections'

describe('holdForConnection', () => {
    beforeEach(() => {
        stoppingConnections.reset()
    })

    it('returns a dequeued job to the queue when the worker has started to stop', async () => {
        stoppingConnections.mark('socket-1')
        const job = { jobId: 'job-1' }
        const release = vi.fn(async () => undefined)
        const record = vi.fn()

        const delivered = await holdForConnection({
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

        const delivered = await holdForConnection({
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

        const delivered = await holdForConnection({
            connectionId: 'socket-1',
            job,
            release,
            record,
        })

        expect(delivered).toBe(job)
        expect(record).toHaveBeenCalledWith(job)
        expect(release).not.toHaveBeenCalled()
    })
})
