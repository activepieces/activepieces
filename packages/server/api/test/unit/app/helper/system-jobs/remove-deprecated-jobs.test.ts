import { Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import IORedis from 'ioredis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SystemJobName } from '../../../../../src/app/helper/system-jobs/common'

const SYSTEM_JOB_QUEUE = 'system-job-queue'
const REDIS_HOST = process.env.AP_REDIS_HOST ?? 'localhost'
const REDIS_PORT = Number(process.env.AP_REDIS_PORT ?? '6379')
const REDIS_DB = 9

const loggedErrors: unknown[] = []
const log: FastifyBaseLogger = {
    debug: () => {}, info: () => {}, warn: () => {}, trace: () => {}, fatal: () => {}, silent: () => {},
    error: (obj: unknown) => {
        loggedErrors.push(obj)
    },
    child: () => log,
    level: 'info',
} as unknown as FastifyBaseLogger

let seedQueue: Queue
let systemJobsSchedule: typeof import('../../../../../src/app/helper/system-jobs/system-job').systemJobsSchedule

describe('removeDeprecatedJobs', () => {
    beforeAll(async () => {
        process.env.AP_REDIS_TYPE = 'default'
        process.env.AP_REDIS_HOST = REDIS_HOST
        process.env.AP_REDIS_PORT = String(REDIS_PORT)
        process.env.AP_REDIS_DB = String(REDIS_DB)
        delete process.env.AP_REDIS_URL
        systemJobsSchedule = (await import('../../../../../src/app/helper/system-jobs/system-job')).systemJobsSchedule

        seedQueue = new Queue(SYSTEM_JOB_QUEUE, {
            connection: new IORedis({ host: REDIS_HOST, port: REDIS_PORT, db: REDIS_DB, maxRetriesPerRequest: null }),
        })
        await seedQueue.waitUntilReady()
        await seedQueue.obliterate({ force: true })
    })

    afterAll(async () => {
        await seedQueue.obliterate({ force: true })
        await seedQueue.close()
        await systemJobsSchedule(log).close()
    })

    it('removes deprecated schedulers and their delayed jobs while keeping live ones', async () => {
        await seedQueue.add('usage-report', {}, { repeat: { pattern: '0 * * * *', tz: 'UTC' } })
        await seedQueue.upsertJobScheduler('trial-tracker', { pattern: '0 * * * *', tz: 'UTC' }, { name: 'trial-tracker', data: {} })
        await seedQueue.add('issue-reminder', {}, { jobId: 'issue-reminder-one-off', delay: 60_000 })
        await seedQueue.upsertJobScheduler(SystemJobName.PIECES_ANALYTICS, { pattern: '0 * * * *', tz: 'UTC' }, { name: SystemJobName.PIECES_ANALYTICS, data: {} })

        await systemJobsSchedule(log).init()

        const schedulerNames = (await seedQueue.getJobSchedulers()).map(scheduler => scheduler.name)
        const jobNames = (await seedQueue.getJobs()).map(job => job.name)

        expect(loggedErrors).toHaveLength(0)
        expect(schedulerNames).toEqual([SystemJobName.PIECES_ANALYTICS])
        expect(jobNames).toEqual([SystemJobName.PIECES_ANALYTICS])
    })
})
