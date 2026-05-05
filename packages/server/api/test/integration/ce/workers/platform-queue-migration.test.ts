import { apId, FlowTriggerType, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { getWorkerGroupQueueName } from '../../../../src/app/workers/job'
import { jobQueue } from '../../../../src/app/workers/job-queue/job-queue'
import { platformQueueMigrationService } from '../../../../src/app/workers/platform-queue-migration.service'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('platformQueueMigrationService', () => {
    let fromQueueName: string
    let toQueueName: string

    beforeEach(() => {
        fromQueueName = getWorkerGroupQueueName(apId())
        toQueueName = getWorkerGroupQueueName(apId())
    })

    afterEach(async () => {
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })
        await fromQueue.obliterate({ force: true })
        await toQueue.obliterate({ force: true })
    })

    it('returns early without touching queues when fromQueueName equals toQueueName', async () => {
        const platformId = apId()
        const flowVersionId = apId()
        const sameQueue = getWorkerGroupQueueName(apId())
        const queue = await jobQueue(app.log).getOrCreateQueue({ queueName: sameQueue })

        await queue.upsertJobScheduler(
            flowVersionId,
            { pattern: '*/5 * * * *', tz: 'UTC' },
            { name: flowVersionId, data: buildPollingJobData({ platformId, flowVersionId }) },
        )

        await platformQueueMigrationService(app.log).migrateJobs({
            fromQueueName: sameQueue,
            toQueueName: sameQueue,
            platformId,
        })

        expect(await queue.getJobSchedulersCount()).toBe(1)
        await queue.obliterate({ force: true })
    })

    it('moves a POLLING scheduler from source queue to target queue', async () => {
        const platformId = apId()
        const flowVersionId = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

        await fromQueue.upsertJobScheduler(
            flowVersionId,
            { pattern: '*/5 * * * *', tz: 'UTC' },
            { name: flowVersionId, data: buildPollingJobData({ platformId, flowVersionId }) },
        )

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId })

        expect(await fromQueue.getJobSchedulersCount()).toBe(0)
        expect(await toQueue.getJobSchedulersCount()).toBe(1)

        const [movedScheduler] = await toQueue.getJobSchedulers(0, 0)
        expect(movedScheduler.id ?? movedScheduler.key).toBe(flowVersionId)
        expect(movedScheduler.template?.data?.platformId).toBe(platformId)
        expect(movedScheduler.pattern).toBe('*/5 * * * *')
    })

    it('does not migrate schedulers belonging to a different platform', async () => {
        const platformA = apId()
        const platformB = apId()
        const flowVersionA = apId()
        const flowVersionB = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

        await fromQueue.upsertJobScheduler(
            flowVersionA,
            { pattern: '*/5 * * * *', tz: 'UTC' },
            { name: flowVersionA, data: buildPollingJobData({ platformId: platformA, flowVersionId: flowVersionA }) },
        )
        await fromQueue.upsertJobScheduler(
            flowVersionB,
            { pattern: '*/10 * * * *', tz: 'UTC' },
            { name: flowVersionB, data: buildPollingJobData({ platformId: platformB, flowVersionId: flowVersionB }) },
        )

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId: platformA })

        expect(await fromQueue.getJobSchedulersCount()).toBe(1)
        expect(await toQueue.getJobSchedulersCount()).toBe(1)

        const [remaining] = await fromQueue.getJobSchedulers(0, 0)
        expect(remaining.template?.data?.platformId).toBe(platformB)

        const [moved] = await toQueue.getJobSchedulers(0, 0)
        expect(moved.template?.data?.platformId).toBe(platformA)
    })

    it('removes the orphaned next-run delayed job from the source queue after scheduler migration', async () => {
        const platformId = apId()
        const flowVersionId = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

        await fromQueue.upsertJobScheduler(
            flowVersionId,
            { pattern: '*/5 * * * *', tz: 'UTC' },
            { name: flowVersionId, data: buildPollingJobData({ platformId, flowVersionId }) },
        )
        // upsertJobScheduler always queues the next-run delayed instance immediately
        expect(await fromQueue.getDelayedCount()).toBe(1)

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId })

        expect(await fromQueue.getDelayedCount()).toBe(0)
        // Target queue has the scheduler and its own next-run delayed job
        expect(await toQueue.getDelayedCount()).toBe(1)
    })

    it('does not remove delayed jobs belonging to other-platform schedulers on the source queue', async () => {
        const platformA = apId()
        const platformB = apId()
        const flowVersionA = apId()
        const flowVersionB = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })

        await fromQueue.upsertJobScheduler(
            flowVersionA,
            { pattern: '*/5 * * * *', tz: 'UTC' },
            { name: flowVersionA, data: buildPollingJobData({ platformId: platformA, flowVersionId: flowVersionA }) },
        )
        await fromQueue.upsertJobScheduler(
            flowVersionB,
            { pattern: '*/10 * * * *', tz: 'UTC' },
            { name: flowVersionB, data: buildPollingJobData({ platformId: platformB, flowVersionId: flowVersionB }) },
        )
        expect(await fromQueue.getDelayedCount()).toBe(2)

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId: platformA })

        // Only platformA's orphaned delayed job should be removed
        expect(await fromQueue.getDelayedCount()).toBe(1)
    })

    it('moves regular (one-time) waiting jobs for the platform', async () => {
        const platformId = apId()
        const jobId = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

        await fromQueue.add(jobId, buildPollingJobData({ platformId, flowVersionId: apId() }), { jobId })

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId })

        expect(await fromQueue.getWaitingCount()).toBe(0)
        expect(await toQueue.getWaitingCount()).toBe(1)

        const [movedJob] = await toQueue.getJobs(['waiting'], 0, 0)
        expect(movedJob.data.platformId).toBe(platformId)
    })

    it('does not move regular jobs belonging to a different platform', async () => {
        const platformA = apId()
        const platformB = apId()
        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

        const jobIdA = apId()
        const jobIdB = apId()
        await fromQueue.add(jobIdA, buildPollingJobData({ platformId: platformA, flowVersionId: apId() }), { jobId: jobIdA })
        await fromQueue.add(jobIdB, buildPollingJobData({ platformId: platformB, flowVersionId: apId() }), { jobId: jobIdB })

        await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId: platformA })

        expect(await fromQueue.getWaitingCount()).toBe(1)
        expect(await toQueue.getWaitingCount()).toBe(1)
    })

    describe('batch logic', () => {
        it('migrates all schedulers when count exceeds batchSize', async () => {
            const platformId = apId()
            const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
            const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })
            const total = 5

            for (let i = 0; i < total; i++) {
                const flowVersionId = apId()
                await fromQueue.upsertJobScheduler(
                    flowVersionId,
                    { pattern: '*/5 * * * *', tz: 'UTC' },
                    { name: flowVersionId, data: buildPollingJobData({ platformId, flowVersionId }) },
                )
            }

            await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId, batchSize: 2 })

            expect(await fromQueue.getJobSchedulersCount()).toBe(0)
            expect(await toQueue.getJobSchedulersCount()).toBe(total)
        })

        it('leaves other-platform schedulers on source when count exceeds batchSize', async () => {
            const platformA = apId()
            const platformB = apId()
            const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
            const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })

            // Interleave platformA and platformB schedulers to exercise multi-batch offset tracking
            for (let i = 0; i < 3; i++) {
                const idA = apId()
                await fromQueue.upsertJobScheduler(idA, { pattern: '*/5 * * * *', tz: 'UTC' }, { name: idA, data: buildPollingJobData({ platformId: platformA, flowVersionId: idA }) })
                const idB = apId()
                await fromQueue.upsertJobScheduler(idB, { pattern: '*/10 * * * *', tz: 'UTC' }, { name: idB, data: buildPollingJobData({ platformId: platformB, flowVersionId: idB }) })
            }

            await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId: platformA, batchSize: 2 })

            expect(await fromQueue.getJobSchedulersCount()).toBe(3)
            expect(await toQueue.getJobSchedulersCount()).toBe(3)

            const remaining = await fromQueue.getJobSchedulers(0, -1)
            expect(remaining.every(s => s.template?.data?.platformId === platformB)).toBe(true)
        })

        it('migrates all regular jobs when count exceeds batchSize', async () => {
            const platformId = apId()
            const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: fromQueueName })
            const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: toQueueName })
            const total = 5

            for (let i = 0; i < total; i++) {
                const jobId = apId()
                await fromQueue.add(jobId, buildPollingJobData({ platformId, flowVersionId: apId() }), { jobId })
            }

            await platformQueueMigrationService(app.log).migrateJobs({ fromQueueName, toQueueName, platformId, batchSize: 2 })

            expect(await fromQueue.getWaitingCount()).toBe(0)
            expect(await toQueue.getWaitingCount()).toBe(total)
        })
    })
})

function buildPollingJobData({ platformId, flowVersionId }: { platformId: string, flowVersionId: string }) {
    return {
        projectId: apId(),
        platformId,
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        flowVersionId,
        flowId: apId(),
        triggerType: FlowTriggerType.PIECE,
        jobType: WorkerJobType.EXECUTE_POLLING,
    }
}
