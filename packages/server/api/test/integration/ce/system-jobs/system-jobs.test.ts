import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { systemJobsQueue, systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { apDayjs } from '@activepieces/server-utils'

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
        if (job.id) {
            await job.remove().catch(() => { /* already removed */ })
        }
    }
    const schedulers = await systemJobsQueue.getJobSchedulers()
    for (const s of schedulers) {
        await systemJobsQueue.removeJobScheduler(s.id ?? s.key).catch(() => { /* already removed */ })
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

    it('should return undefined when jobId exists but name does not match', async () => {
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

        const result = await systemJobsQueue.getJob(jobId)
        expect(result).toBeDefined()

        const guarded = await schedule.getJob(jobId)
        expect(guarded).toBeDefined()
    })
})
