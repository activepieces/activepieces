import { isNil } from '@activepieces/core-utils'
import { createLogger, wideEvent } from '@activepieces/server-utils'
import { Job, Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../database/redis-connections'
import { exceptionHandler } from '../helper/exception-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { QueueName } from '../workers/job'
import { BarrierJobData, BarrierJobName, BarrierQueueConfig, barrierQueueFactory } from './barrier-queue-factory'
import { barrierService } from './barrier-service'
import { fanOutDispatchGaveUp, handleFanOutDispatch, handleFanOutDispatchGaveUp } from './fan-out-dispatcher-job'

let barrierWorker: Worker<BarrierJobData> | undefined = undefined

const barrierQueueInstance = barrierQueueFactory({ createRedisConnection: redisConnections.create })

export const barrierQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const config: BarrierQueueConfig = {
            redisFailedJobRetentionDays: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
            redisFailedJobRetentionMaxCount: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
        }
        await barrierQueueInstance.init(config)
        barrierWorker = new Worker<BarrierJobData>(
            QueueName.BARRIER_EVALUATION,
            async (job) => {
                const jobLogger = createLogger({
                    event: 'barrier.job',
                    job: { id: job.id, type: job.name },
                    fanIn: { barrierId: job.data.barrierId },
                })
                return wideEvent.run({
                    logger: jobLogger,
                    fn: () => processBarrierJob({ job, log })
                        .catch((error: unknown) => {
                            wideEvent.error(error)
                            throw error
                        })
                        .finally(() => jobLogger.emit()),
                })
            },
            {
                connection: await redisConnections.create(),
                concurrency: system.getNumberOrThrow(AppSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY),
                autorun: true,
            },
        )
        barrierWorker.on('failed', (job, error) => {
            if (isNil(job) || job.name !== BarrierJobName.FAN_OUT_DISPATCH) {
                return
            }
            const reason = fanOutDispatchGaveUp({ attemptsMade: job.attemptsMade, attempts: job.opts.attempts, error })
            if (isNil(reason)) {
                return
            }
            handleFanOutDispatchGaveUp({ data: job.data, error, reason, log }).catch((handlerError: unknown) => {
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
        default:
            log.warn({ job: { id: job.id, type: job.name } }, '[barrierQueue#worker] Unknown barrier job name, dropping it')
    }
}

type ProcessBarrierJobParams = {
    job: Job<BarrierJobData>
    log: FastifyBaseLogger
}
