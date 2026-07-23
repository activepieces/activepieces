import { isNil } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { ActionRun } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { redisConnections } from '../database/redis-connections'
import { exceptionHandler } from '../helper/exception-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { QueueName } from '../workers/job'
import { ActionRunEntity } from './action-run.entity'

const actionRunRepo = repoFactory<ActionRun>(ActionRunEntity)

// ponytail: fixed concurrency. An action run is a single terminal insert (no coalescing,
// no lock, no dedup — unlike runsMetadataQueue), so this stays a plain persist job. Add a
// system prop only if write throughput ever needs tuning.
const PERSIST_CONCURRENCY = 10

let worker: Worker<PersistJobData> | undefined = undefined
let queue: Queue<PersistJobData> | undefined = undefined

// The run arrives already thinned (input/output/logs offloaded to the file table by the caller),
// so the queue never carries the raw payload. This is a single terminal insert.
async function persist(data: PersistJobData): Promise<void> {
    await actionRunRepo().save(data.run)
}

export const actionRunPersistQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        queue = new Queue<PersistJobData>(QueueName.ACTION_RUN_PERSIST, {
            connection: await redisConnections.create(),
            defaultJobOptions: {
                attempts: 5,
                backoff: { type: 'exponential', delay: apDayjsDuration(30, 'second').asMilliseconds() },
                removeOnComplete: true,
                removeOnFail: {
                    age: apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds(),
                    count: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
                },
            },
        })
        await queue.waitUntilReady()
        worker = new Worker<PersistJobData>(
            QueueName.ACTION_RUN_PERSIST,
            async (job) => {
                try {
                    await persist(job.data)
                }
                catch (error) {
                    log.error({ error, actionRun: { id: job.data.run.id } }, '[actionRunPersistQueue#worker] failed to persist action run')
                    exceptionHandler.handle(error, log)
                    throw error
                }
            },
            { connection: await redisConnections.create(), concurrency: PERSIST_CONCURRENCY, autorun: true },
        )
        await worker.waitUntilReady()
    },
    async add(data: PersistJobData): Promise<void> {
        if (isNil(queue)) {
            throw new Error('action run persist queue not initialized')
        }
        await queue.add('persist-action-run', data)
    },
    async close(): Promise<void> {
        await queue?.close()
        await worker?.close()
    },
})

type PersistJobData = {
    run: ActionRun
}
