import { UnrecoverableError } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobFailurePager } from '../../../../../src/app/helper/system-jobs/system-job-failure-pager'

const { pageMock, onCallServiceMock, listPendingMock } = vi.hoisted(() => {
    const pageMock = vi.fn()
    return { pageMock, onCallServiceMock: vi.fn(() => ({ page: pageMock })), listPendingMock: vi.fn() }
})

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...original,
        onCallService: onCallServiceMock,
    }
})

vi.mock('../../../../../src/app/database/background-migration-runner', () => ({
    backgroundMigrationRunner: { listPending: listPendingMock },
}))

const log = { error: vi.fn() } as unknown as FastifyBaseLogger
const WEBHOOK_URL = 'https://oncall.example.com/hook'
const PENDING = ['ReshapeFlowRunListIndexesForBarrierChildren1871000000000', 'BackfillPieceTranslation1874000000000']

describe('systemJobFailurePager.pageOnFinalFailure', () => {
    beforeEach(() => {
        process.env.AP_PAGE_ONCALL_WEBHOOK = WEBHOOK_URL
        pageMock.mockResolvedValue(undefined)
        listPendingMock.mockResolvedValue(PENDING)
    })

    afterEach(() => {
        delete process.env.AP_PAGE_ONCALL_WEBHOOK
        vi.clearAllMocks()
    })

    it('pages on-call with the pending migrations and the next step when the job gives up, including a stalled worker', async () => {
        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 28,
            error: new Error('job stalled more than allowable limit'),
            log,
        })

        await vi.waitFor(() => expect(pageMock).toHaveBeenCalled())
        expect(onCallServiceMock).toHaveBeenCalledWith(log, WEBHOOK_URL)
        const [payload] = pageMock.mock.calls[0]
        expect(payload.code).toBe('SYSTEM_JOB_FAILED')
        expect(payload.message).toContain('job stalled more than allowable limit')
        expect(payload.message).toContain(PENDING.join(', '))
        expect(payload.message).toContain('Restart an API pod or deploy to retry them')
        expect(payload.params).toEqual({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 28,
            error: 'job stalled more than allowable limit',
            pendingMigrations: PENDING,
        })
    })

    it('still pages, saying the pending list is unknown, when background_migrations cannot be read', async () => {
        listPendingMock.mockRejectedValue(new Error('connection terminated'))

        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 10,
            error: new Error('canceling statement due to statement timeout'),
            log,
        })

        await vi.waitFor(() => expect(pageMock).toHaveBeenCalled())
        const [payload] = pageMock.mock.calls[0]
        expect(payload.message).toContain('Pending: unknown')
        expect(payload.params.pendingMigrations).toBeNull()
    })

    it('still pages, saying the pending list is unknown, when the lookup hangs on an exhausted database pool', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'] })
        listPendingMock.mockReturnValue(new Promise(() => undefined))

        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 10,
            error: new Error('job stalled more than allowable limit'),
            log,
        })
        await vi.advanceTimersByTimeAsync(5_000)
        vi.useRealTimers()

        await vi.waitFor(() => expect(pageMock).toHaveBeenCalled())
        const [payload] = pageMock.mock.calls[0]
        expect(payload.message).toContain('Pending: unknown')
        expect(payload.params.pendingMigrations).toBeNull()
    })

    it('does not page for system jobs outside the paged set', async () => {
        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.FILE_CLEANUP_TRIGGER,
            jobId: 'file-cleanup-trigger',
            attemptsMade: 3,
            error: new Error('boom'),
            log,
        })

        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(listPendingMock).not.toHaveBeenCalled()
        expect(pageMock).not.toHaveBeenCalled()
    })

    it('logs instead of throwing when the page itself fails', async () => {
        pageMock.mockRejectedValue(new Error('webhook down'))

        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 10,
            error: new Error('canceling statement due to statement timeout'),
            log,
        })

        await vi.waitFor(() => expect(log.error).toHaveBeenCalled())
    })
})

describe('systemJobFailurePager.gaveUp', () => {
    it('is true for a stalled job on its first attempt, because BullMQ fails it as unrecoverable', () => {
        expect(systemJobFailurePager.gaveUp({ attemptsMade: 1, attempts: 10, error: new UnrecoverableError('job stalled more than allowable limit') })).toBe(true)
    })

    it('is true once the attempts are used up', () => {
        expect(systemJobFailurePager.gaveUp({ attemptsMade: 10, attempts: 10, error: new Error('canceling statement due to statement timeout') })).toBe(true)
    })

    it('is false while BullMQ will still retry', () => {
        expect(systemJobFailurePager.gaveUp({ attemptsMade: 3, attempts: 10, error: new Error('canceling statement due to statement timeout') })).toBe(false)
    })
})
