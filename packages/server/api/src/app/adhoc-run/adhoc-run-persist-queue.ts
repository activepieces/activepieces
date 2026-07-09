import { isNil } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { AdhocRun, FileCompression, FileType } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { redisConnections } from '../database/redis-connections'
import { fileCompressor } from '../file/file-compressor'
import { fileService } from '../file/file.service'
import { exceptionHandler } from '../helper/exception-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { QueueName } from '../workers/job'
import { AdhocRunEntity } from './adhoc-run.entity'

const adhocRunRepo = repoFactory<AdhocRun>(AdhocRunEntity)

// ponytail: fixed concurrency. An adhoc run is a single terminal insert (no coalescing,
// no lock, no dedup — unlike runsMetadataQueue), so this stays a plain persist job. Add a
// system prop only if write throughput ever needs tuning.
const PERSIST_CONCURRENCY = 10

let worker: Worker<PersistJobData> | undefined = undefined
let queue: Queue<PersistJobData> | undefined = undefined

async function persist(data: PersistJobData, log: FastifyBaseLogger): Promise<void> {
    const { run, platformId } = data
    if (!isNil(run.logsFileId)) {
        const blob = Buffer.from(JSON.stringify({ input: run.input, output: run.output, logs: run.logs }))
        const compressed = await fileCompressor.compress({ data: blob, compression: FileCompression.ZSTD })
        await fileService(log).save({
            fileId: run.logsFileId,
            projectId: run.projectId,
            platformId,
            type: FileType.ADHOC_RUN_LOG,
            data: compressed,
            size: compressed.length,
            compression: FileCompression.ZSTD,
        })
    }
    await adhocRunRepo().save({
        ...run,
        input: null,
        output: null,
        logs: null,
    })
}

export const adhocRunPersistQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        queue = new Queue<PersistJobData>(QueueName.ADHOC_RUN_PERSIST, {
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
            QueueName.ADHOC_RUN_PERSIST,
            async (job) => {
                try {
                    await persist(job.data, log)
                }
                catch (error) {
                    log.error({ error, adhocRun: { id: job.data.run.id } }, '[adhocRunPersistQueue#worker] failed to persist adhoc run')
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
            throw new Error('Adhoc run persist queue not initialized')
        }
        await queue.add('persist-adhoc-run', data)
    },
    async close(): Promise<void> {
        await queue?.close()
        await worker?.close()
    },
})

type PersistJobData = {
    run: AdhocRun
    platformId: string
}
