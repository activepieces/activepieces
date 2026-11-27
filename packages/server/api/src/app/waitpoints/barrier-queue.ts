import { isNil } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { Job, Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisErrorLogger } from '../database/redis/redis-error-logger'
import { redisConnections } from '../database/redis-connections'
import { exceptionHandler } from '../helper/exception-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { QueueName } from '../workers/job'
import { BarrierJobData, BarrierJobName, BarrierQueueConfig, barrierQueueFactory } from './barrier-queue-factory'
import { barrierService } from './barrier-service'
import { handleFanOutDispatch, handleFanOutDispatchFailed, handleFanOutDispatchGaveUp } from './fan-out-dispatcher-job'

let barrierWorker: Worker<BarrierJobData> | undefined = undefined

const barrierQueueInstance = barrierQueueFactory({ createRedisConnection: redisConnections.create })

export const barrierQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const config: BarrierQueueConfig = {
            redisFailedJobRetentionDays: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
            redisFailedJobRetentionMaxCount: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
        }
        await barrierQueueInstance.init(config)
        const connection = await redisConnections.create()
        barrierWorker = new Worker<BarrierJobData>(
            QueueName.BARRIER_EVALUATION,
            async (job) => {
                return wideEvent.runJob({
                    fields: {
                        event: 'barrier.job',
                        job: { id: job.id, type: job.name },
                        waitpoint: { id: job.data.barrierId },
                    },
                    fn: () => processBarrierJob({ job, log }),
                })
            },
            {
                connection,
                concurrency: system.getNumberOrThrow(AppSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY),
                autorun: true,
            },
        )
        redisErrorLogger.attachToBullmq({
            emitter: barrierWorker,
            connection,
            queueName: QueueName.BARRIER_EVALUATION,
            role: 'worker',
            log,
        })
        barrierWorker.on('failed', (job, error) => {
            if (isNil(job) || job.name !== BarrierJobName.FAN_OUT_DISPATCH) {
                return
            }
            handleFanOutDispatchFailed({ data: job.data, attemptsMade: job.attemptsMade, attempts: job.opts.attempts, error, log }).catch((handlerError: unknown) => {
                exceptionHandler.handle(handlerError, log)
            })
        })

        await barrierWorker.waitUntilReady()
    },

    async enqueueEvaluation(params: BarrierJobData): Promise<void> {
        await barrierQueueInstance.enqueueEvaluation(params)
    },

    async addFanOutDispatch(params: BarrierJobData): Promise<void> {
        await barrierQueueInstance.addFanOutDispatch(params)
    },

    async addFanOutGiveUp(params: BarrierJobData): Promise<void> {
        await barrierQueueInstance.addFanOutGiveUp(params)
    },

    async clearEvaluationDedupKey(barrierId: string): Promise<void> {
        await barrierQueueInstance.clearEvaluationDedupKey(barrierId)
    },

    get(): Queue<BarrierJobData> {
        return barrierQueueInstance.get()
    },

    async close(): Promise<void> {
        if (barrierQueueInstance.isInitialized()) {
            await barrierQueueInstance.get().close()
        }
        if (barrierWorker) {
            await barrierWorker.close()
        }
    },
})

async function processBarrierJob({ job, log }: ProcessBarrierJobParams): Promise<void> {
    switch (job.name) {
        case BarrierJobName.EVALUATE:
            await barrierQueueInstance.clearEvaluationDedupKey(job.data.barrierId)
            await barrierService(log).releaseIfReady({ barrierId: job.data.barrierId, projectId: job.data.projectId })
            return
        case BarrierJobName.FAN_OUT_DISPATCH:
            await handleFanOutDispatch({ data: job.data, log })
            return
        case BarrierJobName.FAN_OUT_GIVE_UP:
            await handleFanOutDispatchGaveUp({ data: job.data, log })
            return
        default:
            log.warn({ job: { id: job.id, type: job.name } }, '[barrierQueue#worker] Unknown barrier job name, dropping it')
    }
}

type ProcessBarrierJobParams = {
    job: Job<BarrierJobData>
    log: FastifyBaseLogger
}
