import { apAxios, apDayjsDuration, AppSystemProp } from '@activepieces/server-shared'
import { ApId, assertNotNullOrUndefined, FlowRun, FlowRunStatus, isNil, PauseMetadata, PauseType, ProjectId, spreadIfDefined, WebsocketClientEvent } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Queue, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { distributedLock, redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { distributedStore } from '../../helper/key-value'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { flowRunRepo } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'

let runsMetadataQueueInstance: Queue<RunsMetadataJobData> | undefined = undefined
let runsMetadataWorker: Worker<RunsMetadataJobData> | undefined = undefined

const redisMetadaKey = (runId: ApId) => `runs_metadata:${runId}`

export const runsMetadataQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const queueName = 'runsMetadata'
        const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
        runsMetadataQueueInstance = new Queue<RunsMetadataJobData>(queueName, {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: apDayjsDuration(8, 'minute').asMilliseconds(),
                },
                removeOnComplete: true,
                removeOnFail: {
                    age: apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds(),
                    count: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
                },
            },
        })
        await runsMetadataQueueInstance.waitUntilReady()
        runsMetadataWorker = new Worker<RunsMetadataJobData>(
            queueName,
            async (job) => {
                log.info({
                    jobId: job.id,
                    runId: job.data.runId,
                }, '[runsMetadataQueue#worker] Saving runs metadata')
                const key = redisMetadaKey(job.data.runId)
                await distributedLock(log).runExclusive({
                    key: `runs_metadata_${job.data.runId}`,
                    timeoutInSeconds: 30,
                    fn: async () => {
                        try {
                            log.info({
                                jobId: job.id,
                                runId: job.data.runId,
                            }, '[runsMetadataQueue#worker] Acquired lock')

                            assertNotNullOrUndefined(runsMetadataQueueInstance, 'Queue not initialized')
                            await runsMetadataQueueInstance.removeDeduplicationKey(job.data.runId)
                            const runMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(key)
                            if (isNil(runMetadata) || Object.keys(runMetadata).length === 0) {
                                log.info({
                                    jobId: job.id,
                                    runId: job.data.runId,
                                }, '[runsMetadataQueue#worker] Runs metadata not found, skipping job')
                                return
                            }
                            const runExists = await flowRunRepo().existsBy({ id: job.data.runId })
                            let savedFlowRun: FlowRun
                            if (runExists) {
                                await flowRunRepo().update(job.data.runId, {
                                    ...spreadIfDefined('projectId', runMetadata.projectId),
                                    ...spreadIfDefined('flowId', runMetadata.flowId),
                                    ...spreadIfDefined('flowVersionId', runMetadata.flowVersionId),
                                    ...spreadIfDefined('environment', runMetadata.environment),
                                    ...spreadIfDefined('startTime', runMetadata.startTime),
                                    ...spreadIfDefined('finishTime', runMetadata.finishTime),
                                    ...spreadIfDefined('status', runMetadata.status),
                                    ...spreadIfDefined('tags', runMetadata.tags),
                                    ...spreadIfDefined('duration', runMetadata.duration),
                                    ...spreadIfDefined('tasks', runMetadata.tasks),
                                    ...spreadIfDefined('pauseMetadata', runMetadata.pauseMetadata as PauseMetadata),
                                    ...spreadIfDefined('failedStepName', runMetadata.failedStepName),
                                    ...spreadIfDefined('stepNameToTest', runMetadata.stepNameToTest),
                                    ...spreadIfDefined('parentRunId', runMetadata.parentRunId),
                                    ...spreadIfDefined('failParentOnFailure', runMetadata.failParentOnFailure),
                                    ...spreadIfDefined('logsFileId', runMetadata.logsFileId),
                                    ...spreadIfDefined('created', runMetadata.created),
                                    ...spreadIfDefined('updated', runMetadata.updated),
                                })
                                savedFlowRun = await flowRunRepo().findOneByOrFail({ id: job.data.runId })
                            }
                            else {
                                savedFlowRun = await flowRunRepo().save(runMetadata)
                            }


                            const shouldMarkParentAsFailed = savedFlowRun.failParentOnFailure && !isNil(savedFlowRun.parentRunId) && ![FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED, FlowRunStatus.QUEUED].includes(savedFlowRun.status)
                            if (shouldMarkParentAsFailed) {
                                const platformId = await projectService.getPlatformId(savedFlowRun.projectId)
                                await markParentRunAsFailed({
                                    parentRunId: savedFlowRun.parentRunId!,
                                    childRunId: savedFlowRun.id,
                                    projectId: savedFlowRun.projectId,
                                    platformId,
                                })
                            }

                            if (!isNil(runMetadata.finishTime)) {
                                await flowRunSideEffects(log).onFinish(savedFlowRun)
                            }

                            websocketService.to(savedFlowRun.projectId).emit(WebsocketClientEvent.FLOW_RUN_PROGRESS, {
                                runId: savedFlowRun.id,
                            })
                        }
                        catch (error) {
                            log.error(error, '[runsMetadataQueue#worker] Error saving runs metadata')
                            throw error
                        }
                    },
                })

            },
            {
                connection: await redisConnections.create(),
                telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
                concurrency: system.getNumberOrThrow(AppSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY),
                autorun: true,
            },
        )

        await runsMetadataWorker.waitUntilReady()
    },

    async add(params: RunsMetadataUpsertData): Promise<void> {

        assertNotNullOrUndefined(runsMetadataQueueInstance, 'Runs metadata queue not initialized')
        await distributedStore.merge(redisMetadaKey(params.id), params)

        await runsMetadataQueueInstance.add(
            'update-run-metadata',
            { runId: params.id, projectId: params.projectId },
            { deduplication: { id: params.id } },
        )
    },

    get(): Queue<RunsMetadataJobData> {
        assertNotNullOrUndefined(runsMetadataQueueInstance, 'Runs metadata queue not initialized')
        return runsMetadataQueueInstance
    },

})



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

export const RunsMetadataJobData = Type.Object({
    runId: Type.String(),
    projectId: Type.String(),
})

export type RunsMetadataJobData = Static<typeof RunsMetadataJobData>

export type RunsMetadataUpsertData = Partial<FlowRun> & {
    id: ApId
    projectId: ProjectId
}
