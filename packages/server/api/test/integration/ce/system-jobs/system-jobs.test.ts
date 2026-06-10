import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { systemJobsQueue, systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { apDayjs } from '@activepieces/server-utils'

const TEST_PREFIX = 'test-'

let app: FastifyInstance
let schedule: ReturnType<typeof systemJobsSchedule>

beforeAll(async () => {
    app = await setupTestEnvironment()
    schedule = systemJobsSchedule(app.log)
    await schedule.init()
})

afterAll(async () => {
    await schedule.close()
    await teardownTestEnvironment()
})

afterEach(async () => {
    const jobs = await systemJobsQueue.getJobs()
    for (const job of jobs) {
        if (job.id?.startsWith(TEST_PREFIX)) {
            await job.remove().catch(() => { /* already removed */ })
        }
    }
    const schedulers = await systemJobsQueue.getJobSchedulers()
    for (const s of schedulers) {
        const key = s.id ?? s.key
        if (key.startsWith(TEST_PREFIX) || key.includes('::') || key === 'pieces-analytics') {
            await systemJobsQueue.removeJobScheduler(key).catch(() => { /* already removed */ })
        }
    }
})

describe('System Jobs', () => {
    it('should create a one-time job retrievable by jobId', async () => {
        const jobId = 'test-one-time-job'

        await schedule.upsertJob({
            job: {
                name: SystemJobName.FILE_CLEANUP_TRIGGER,
                data: {},
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'hour'),
            },
        })

        const retrieved = await schedule.getJob(jobId)
        expect(retrieved).toBeDefined()
        expect(retrieved!.name).toBe(SystemJobName.FILE_CLEANUP_TRIGGER)
    })

    it('should not duplicate when upserting with same jobId', async () => {
        const jobId = 'test-no-dup-job'

        await schedule.upsertJob({
            job: {
                name: SystemJobName.FILE_CLEANUP_TRIGGER,
                data: {},
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'hour'),
            },
        })

        await schedule.upsertJob({
            job: {
                name: SystemJobName.FILE_CLEANUP_TRIGGER,
                data: {},
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(2, 'hours'),
            },
        })

        const allJobs = await systemJobsQueue.getJobs()
        const matching = allJobs.filter(j => j.id === jobId)
        expect(matching).toHaveLength(1)
    })

    it('should create a repeated job scheduler', async () => {
        const jobId = 'test-repeated-job'

        await schedule.upsertJob({
            job: {
                name: SystemJobName.FILE_CLEANUP_TRIGGER,
                data: {},
                jobId,
            },
            schedule: {
                type: 'repeated',
                cron: '0 0 * * *',
            },
        })

        const schedulers = await systemJobsQueue.getJobSchedulers()
        const matching = schedulers.filter(s => s.name === SystemJobName.FILE_CLEANUP_TRIGGER)
        expect(matching.length).toBeGreaterThanOrEqual(1)
    })

    it('should return undefined for non-existent jobId', async () => {
        const result = await schedule.getJob('does-not-exist')
        expect(result).toBeUndefined()
    })

    it('should remove legacy schedulers with :: in key on init', async () => {
        // Simulate a legacy scheduler by creating one with a key containing '::'
        // This mimics what older BullMQ versions produced when no jobId was set.
        const legacyKey = `${SystemJobName.FILE_CLEANUP_TRIGGER}::0:UTC:0 3 * * *`
        await systemJobsQueue.upsertJobScheduler(legacyKey, {
            pattern: '0 3 * * *',
            tz: 'UTC',
        }, {
            name: SystemJobName.FILE_CLEANUP_TRIGGER,
            data: {} as never,
        })

        const before = await systemJobsQueue.getJobSchedulers()
        const legacyBefore = before.filter(
            s => s.name === SystemJobName.FILE_CLEANUP_TRIGGER && s.key.includes('::'),
        )
        expect(legacyBefore.length).toBeGreaterThanOrEqual(1)

        // Re-init triggers removeDeprecatedJobs which should clean up legacy schedulers
        await schedule.init()

        const after = await systemJobsQueue.getJobSchedulers()
        const legacyAfter = after.filter(
            s => s.name === SystemJobName.FILE_CLEANUP_TRIGGER && s.key.includes('::'),
        )
        expect(legacyAfter).toHaveLength(0)
    })

    it('should keep new-format schedulers while removing legacy ones', async () => {
        // Create a legacy scheduler (key contains ::)
        const legacyKey = `${SystemJobName.PIECES_ANALYTICS}::0:UTC:0 12 * * *`
        await systemJobsQueue.upsertJobScheduler(legacyKey, {
            pattern: '0 12 * * *',
            tz: 'UTC',
        }, {
            name: SystemJobName.PIECES_ANALYTICS,
            data: {} as never,
        })

        // Create a new-format scheduler (key is just the jobId, no ::)
        await schedule.upsertJob({
            job: {
                name: SystemJobName.PIECES_ANALYTICS,
                data: {},
                jobId: 'pieces-analytics',
            },
            schedule: {
                type: 'repeated',
                cron: '0 12 * * *',
            },
        })

        const before = await systemJobsQueue.getJobSchedulers()
        const analyticsBefore = before.filter(s => s.name === SystemJobName.PIECES_ANALYTICS)
        expect(analyticsBefore.length).toBeGreaterThanOrEqual(2)

        await schedule.init()

        const after = await systemJobsQueue.getJobSchedulers()
        const legacyAfter = after.filter(
            s => s.name === SystemJobName.PIECES_ANALYTICS && s.key.includes('::'),
        )
        const newAfter = after.filter(
            s => s.name === SystemJobName.PIECES_ANALYTICS && !s.key.includes('::'),
        )
        expect(legacyAfter).toHaveLength(0)
        expect(newAfter.length).toBeGreaterThanOrEqual(1)
    })

    it('should not match job when jobId exists but name differs', async () => {
        const jobId = 'test-name-guard'

        await schedule.upsertJob({
            job: {
                name: SystemJobName.FILE_CLEANUP_TRIGGER,
                data: {},
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'hour'),
            },
        })

        // Raw BullMQ lookup finds the job
        const raw = await systemJobsQueue.getJob(jobId)
        expect(raw).toBeDefined()
        expect(raw!.name).toBe(SystemJobName.FILE_CLEANUP_TRIGGER)

        // Upserting with same jobId but different name treats it as non-existent
        // (name guard rejects the match), so upsert attempts to add again.
        // BullMQ deduplicates by jobId, so the original job persists unchanged.
        await schedule.upsertJob({
            job: {
                name: SystemJobName.RUN_TELEMETRY,
                data: {},
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(2, 'hours'),
            },
        })

        const after = await systemJobsQueue.getJob(jobId)
        expect(after).toBeDefined()
        expect(after!.name).toBe(SystemJobName.FILE_CLEANUP_TRIGGER)
    })
})
