import { apAxios, apDayjsDuration, AppSystemProp } from '@activepieces/server-shared'
import { ApId, assertNotNullOrUndefined, FlowRun, FlowRunStatus, isNil, PauseType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Queue, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { distributedStore } from '../../helper/key-value'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { flowRunRepo, flowRunService } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'

export const RunsMetadataJobData = Type.Object({
    runId: Type.String(),
})

export type RunsMetadataJobData = Static<typeof RunsMetadataJobData>

export type RunsMetadataUpsertData = Partial<FlowRun> & {
    id: ApId
}

export enum RunsMetadataDeleteFailureReason {
    UPDATED_AT_CHANGED = 'UPDATED_AT_CHANGED',
    KEY_NOT_FOUND = 'KEY_NOT_FOUND',
}

export const RUNS_METADATA_QUEUE_NAME = 'runsMetadata'
const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

export let runsMetadataQueueInstance: Queue<RunsMetadataJobData> | undefined = undefined
let runsMetadataWorker: Worker<RunsMetadataJobData> | undefined = undefined

export const runsMetadataQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        if (!isNil(runsMetadataQueueInstance) && !isNil(runsMetadataWorker)) {
            return
        }

        await ensureQueueExists()
        runsMetadataWorker = await ensureWorkerExists(log)
    },

    async add(params: RunsMetadataUpsertData): Promise<void> {
        const queue = await ensureQueueExists()
        await distributedStore.merge(this.getRunsMetadataKey(params.id), params)

        await queue.add(
            'update-run-metadata',
            { runId: params.id },
            { deduplication: { id: params.id } },
        )
    },

    async get(): Promise<Queue<RunsMetadataJobData>> {
        return ensureQueueExists()
    },

    async getRunMetadata(runId: ApId): Promise<RunsMetadataUpsertData | null> {
        return distributedStore.hgetall<RunsMetadataUpsertData>(this.getRunsMetadataKey(runId))
    },

    async deleteRunMetadata(runId: ApId): Promise<void> {
        await distributedStore.hdelete(this.getRunsMetadataKey(runId))
    },

    getRunsMetadataKey: (runId: ApId): string => `runs-metadata:${runId}`,
})

async function ensureQueueExists(): Promise<Queue<RunsMetadataJobData>> {
    if (!isNil(runsMetadataQueueInstance)) {
        return runsMetadataQueueInstance
    }

    runsMetadataQueueInstance = new Queue<RunsMetadataJobData>(RUNS_METADATA_QUEUE_NAME, {
        connection: await redisConnections.create(),
        telemetry: isOtelEnabled ? new BullMQOtel(RUNS_METADATA_QUEUE_NAME) : undefined,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: EIGHT_MINUTES_IN_MILLISECONDS,
            },
            removeOnComplete: true,
            removeOnFail: {
                age: REDIS_FAILED_JOB_RETENTION_DAYS,
                count: REDIS_FAILED_JOB_RETRY_COUNT,
            },
        },
    })

    await runsMetadataQueueInstance.waitUntilReady()
    return runsMetadataQueueInstance
}

async function ensureWorkerExists(log: FastifyBaseLogger): Promise<Worker<RunsMetadataJobData>> {
    if (!isNil(runsMetadataWorker)) {
        return runsMetadataWorker
    }

    runsMetadataWorker = new Worker<RunsMetadataJobData>(
        RUNS_METADATA_QUEUE_NAME,
        async (job) => {
            const key = runsMetadataQueue(log).getRunsMetadataKey(job.data.runId)
            log.info({
                message: 'Processing runs metadata job',
                jobId: job.id,
                runId: job.data.runId,
            })
            await (await runsMetadataQueue(log).get()).removeDeduplicationKey(job.data.runId)
            
            try {
                const redisConnection = await redisConnections.create()
                try {
                    await redisConnection.watch(key)
                    const hashData = await redisConnection.hgetall(key)

                    if (isNil(hashData) || Object.keys(hashData).length === 0) {
                        log.warn({
                            message: 'No metadata found for run',
                            jobId: job.id,
                            runId: job.data.runId,
                        })
                        await redisConnection.unwatch()
                        return
                    }
                    
                    const runMetadata = distributedStore.parseHashData<RunsMetadataUpsertData>(hashData)
                    await flowRunRepo().save(runMetadata)

                    const flowRun = await flowRunService(log).getOneOrThrow({ id: job.data.runId, projectId: runMetadata.projectId })
                    
                    const shouldMarkParentAsFailed = flowRun.failParentOnFailure && !isNil(flowRun.parentRunId) && ![FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED, FlowRunStatus.QUEUED].includes(flowRun.status)
                    if (shouldMarkParentAsFailed) {
                        const platformId = await projectService.getPlatformId(flowRun.projectId)
                        await markParentRunAsFailed({
                            parentRunId: flowRun.parentRunId!,
                            childRunId: flowRun.id,
                            projectId: flowRun.projectId,
                            platformId,
                        })
                    }

                    if (!isNil(runMetadata.finishTime)) {
                        await flowRunSideEffects(log).onFinish(flowRun)
                    }

                    const multi = redisConnection.multi()
                    multi.del(key)

                    const result = await multi.exec()
                    if (isNil(result)) {
                        log.info({
                            message: 'Kept runs metadata in Redis (key was modified)',
                            jobId: job.id,
                            runId: job.data.runId,
                        })
                        return
                    }

                    log.info({
                        message: 'Deleted runs metadata from Redis',
                        jobId: job.id,
                        runId: job.data.runId,
                    })
                }
                finally {
                    await redisConnection.quit()
                }
            }
            catch (error) {
                log.error({
                    message: 'Error processing runs metadata job',
                    jobId: job.id,
                    runId: job.data.runId,
                    error,
                })
                throw error
            }
        },
        {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(RUNS_METADATA_QUEUE_NAME) : undefined,
            concurrency: 10,
            autorun: true,
        },
    )

    await runsMetadataWorker.waitUntilReady()
    return runsMetadataWorker
}

async function markParentRunAsFailed({
    parentRunId,
    childRunId,
    projectId,
    platformId,
}: MarkParentRunAsFailedParams): Promise<void> {
    const flowRun = await flowRunRepo().findOneByOrFail({
        id: parentRunId,
    })

    const requestId = flowRun.pauseMetadata?.type === PauseType.WEBHOOK ? flowRun.pauseMetadata?.requestId : undefined
    assertNotNullOrUndefined(requestId, 'Parent run has no request id')

    const callbackUrl = await domainHelper.getPublicApiUrl({ path: `/v1/flow-runs/${parentRunId}/requests/${requestId}`, platformId })
    const childRunUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/runs/${childRunId}`, platformId })
    await apAxios.post(callbackUrl, {
        status: 'error',
        data: {
            message: 'Subflow execution failed',
            link: childRunUrl,
        },
    })
}

type MarkParentRunAsFailedParams = {
    parentRunId: string
    childRunId: string
    projectId: string
    platformId: string
}

