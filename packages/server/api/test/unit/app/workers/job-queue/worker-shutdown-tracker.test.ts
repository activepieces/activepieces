import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WAITER_TIMEOUT_MS } from '../../../../../src/app/workers/job-queue/queue-dispatcher'
import { workerShutdownTracker } from '../../../../../src/app/workers/job-queue/worker-shutdown-tracker'

describe('workerShutdownTracker', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        workerShutdownTracker.reset()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('keeps a connection marked for longer than a poll can wait in the dispatcher', () => {
        workerShutdownTracker.markShuttingDown('socket-1')
        vi.advanceTimersByTime(WAITER_TIMEOUT_MS + 1_000)
        expect(workerShutdownTracker.isShuttingDown('socket-1')).toBe(true)
    })

    it('forgets the connection once no poll it sent can still return', () => {
        workerShutdownTracker.markShuttingDown('socket-1')
        vi.advanceTimersByTime(WAITER_TIMEOUT_MS + 10_001)
        expect(workerShutdownTracker.isShuttingDown('socket-1')).toBe(false)
    })

    it('marks only the connection that is shutting down', () => {
        workerShutdownTracker.markShuttingDown('socket-1')
        expect(workerShutdownTracker.isShuttingDown('socket-2')).toBe(false)
        expect(workerShutdownTracker.isShuttingDown(undefined)).toBe(false)
    })
})
