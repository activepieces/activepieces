import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobFailurePager } from '../../../../../src/app/helper/system-jobs/system-job-failure-pager'

const { pageMock, onCallServiceMock } = vi.hoisted(() => {
    const pageMock = vi.fn()
    return { pageMock, onCallServiceMock: vi.fn(() => ({ page: pageMock })) }
})

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...original,
        onCallService: onCallServiceMock,
    }
})

const log = { error: vi.fn() } as unknown as FastifyBaseLogger
const WEBHOOK_URL = 'https://oncall.example.com/hook'

describe('systemJobFailurePager.pageOnFinalFailure', () => {
    beforeEach(() => {
        process.env.AP_PAGE_ONCALL_WEBHOOK = WEBHOOK_URL
        pageMock.mockResolvedValue(undefined)
    })

    afterEach(() => {
        delete process.env.AP_PAGE_ONCALL_WEBHOOK
        vi.clearAllMocks()
    })

    it('pages on-call when the background migrations job gives up, including a stalled worker', () => {
        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS,
            jobId: 'run-background-migrations',
            attemptsMade: 28,
            error: new Error('job stalled more than allowable limit'),
            log,
        })

        expect(onCallServiceMock).toHaveBeenCalledWith(log, WEBHOOK_URL)
        expect(pageMock).toHaveBeenCalledWith({
            code: 'SYSTEM_JOB_FAILED',
            message: expect.stringContaining('job stalled more than allowable limit'),
            params: { jobName: SystemJobName.RUN_BACKGROUND_MIGRATIONS, jobId: 'run-background-migrations', attemptsMade: 28 },
        })
    })

    it('does not page for system jobs outside the paged set', () => {
        systemJobFailurePager.pageOnFinalFailure({
            jobName: SystemJobName.FILE_CLEANUP_TRIGGER,
            jobId: 'file-cleanup-trigger',
            attemptsMade: 3,
            error: new Error('boom'),
            log,
        })

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
