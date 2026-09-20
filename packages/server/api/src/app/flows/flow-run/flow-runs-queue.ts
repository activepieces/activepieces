import { apId, assertNotNullOrUndefined, isNil, sanitizeObjectForPostgresql, spreadIfDefined } from '@activepieces/core-utils'
import { FlowRun, FlowRunStatus, isFlowRunStateTerminal, RunTimeline } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock, distributedStore, redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../helper/domain-helper'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { resumeService } from '../../waitpoints/resume-service'
import { waitpointService } from '../../waitpoints/waitpoint-service'
import { WaitpointStatus } from '../../waitpoints/waitpoint-types'
import { legacyRedisMetadataKey, QueueName, redisMetadataKey, runsMetadataDeduplicationId, RunsMetadataJobData, RunsMetadataQueueConfig, runsMetadataQueueFactory, RunsMetadataUpsertData } from '../../workers/job'
import { flowService } from '../flow/flow.service'
import { flowRunRepo } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'
import { buildRunTimeline } from './run-timeline'

let runsMetadataWorker: Worker<RunsMetadataJobData> | undefined = undefined

const queue = runsMetadataQueueFactory({ createRedisConnection: redisConnections.create, distributedStore })

export const runsMetadataQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const queueName = QueueName.RUNS_METADATA

        const config: RunsMetadataQueueConfig = {
            redisFailedJobRetentionDays: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
            redisFailedJobRetentionMaxCount: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
        }
        await queue.init(config)
        runsMetadataWorker = new Worker<RunsMetadataJobData>(
            queueName,
            async (job) => {
                log.info({
                    job: { id: job.id },
                    flowRun: { id: job.data.runId },
                }, '[runsMetadataQueue#worker] Saving runs metadata')
                assertNotNullOrUndefined(job.data.projectId, 'projectId')
                const key = redisMetadataKey({ projectId: job.data.projectId, runId: job.data.runId })
                await distributedLock(log).runExclusive({
                    key: `runs_metadata_${job.data.runId}`,
                    timeoutInSeconds: 30,
                    fn: async () => {
                        try {
                            await runsMetadataQueue(log).get().removeDeduplicationKey(runsMetadataDeduplicationId({ projectId: job.data.projectId, runId: job.data.runId }))
                            const rawRunMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(key)
                                ?? await claimMetadataWrittenBeforeTheKeyWasScoped(job.data)
                            if (isNil(rawRunMetadata) || Object.keys(rawRunMetadata).length === 0) {
                                log.info({
                                    job: { id: job.id },
                                    flowRun: { id: job.data.runId },
                                }, '[runsMetadataQueue#worker] Runs metadata not found, skipping job')
                                return
                            }
                            const runMetadata = sanitizeObjectForPostgresql(rawRunMetadata)

                            const flowRunScope = { id: job.data.runId, projectId: job.data.projectId }
                            const existingFlowRun = await flowRunRepo().findOneBy(flowRunScope)
                            let savedFlowRun: FlowRun
                            if (!isNil(existingFlowRun)) {
                                const timeline = buildTimeline({ existingFlowRun, runMetadata })
                                await flowRunRepo().update(flowRunScope, {
                                    ...spreadIfDefined('timeline', timeline),
                                    ...spreadIfDefined('flowId', runMetadata.flowId),
                                    ...spreadIfDefined('flowVersionId', runMetadata.flowVersionId),
                                    ...spreadIfDefined('environment', runMetadata.environment),
                                    ...spreadIfDefined('startTime', runMetadata.startTime),
                                    ...spreadIfDefined('finishTime', runMetadata.finishTime),
                                    ...spreadIfDefined('status', runMetadata.status),
                                    ...spreadIfDefined('tags', runMetadata.tags),
                                    ...spreadIfDefined('failedStep', runMetadata.failedStep),
                                    ...spreadIfDefined('stepNameToTest', runMetadata.stepNameToTest),
                                    ...spreadIfDefined('parentRunId', runMetadata.parentRunId),
                                    ...spreadIfDefined('failParentOnFailure', runMetadata.failParentOnFailure),
                                    ...spreadIfDefined('logsFileId', runMetadata.logsFileId),
                                    ...spreadIfDefined('updated', runMetadata.updated),
                                    ...spreadIfDefined('stepsCount', runMetadata.stepsCount),
                                })
                                const updatedFlowRun = await flowRunRepo().findOneBy(flowRunScope)
                                if (isNil(updatedFlowRun)) {
                                    log.info({
                                        job: { id: job.id },
                                        flowRun: { id: job.data.runId },
                                    }, '[runsMetadataQueue#worker] Flow run was deleted during update, skipping job')
                                    return
                                }
                                savedFlowRun = updatedFlowRun
                            }
                            else {
                                const idBelongsToAnotherProject = await flowRunRepo().countBy({ id: job.data.runId }) > 0
                                if (idBelongsToAnotherProject) {
                                    log.warn({
                                        job: { id: job.id },
                                        flowRun: { id: job.data.runId },
                                        project: { id: job.data.projectId },
                                    }, '[runsMetadataQueue#worker] Run metadata reported for a run owned by another project, skipping job')
                                    return
                                }
                                const flowId = runMetadata.flowId
                                const flowExists = !isNil(flowId) && await flowService(log).exists({ id: flowId, projectId: job.data.projectId })
                                if (!flowExists) {
                                    log.info({
                                        job: { id: job.id },
                                        flowRun: { id: job.data.runId },
                                    }, '[runsMetadataQueue#worker] Flow does not exist (deleted), skipping job')
                                    return
                                }
                                savedFlowRun = await flowRunRepo().save({ ...runMetadata, ...flowRunScope })
                            }

                            const parentRunId = savedFlowRun.parentRunId
                            const shouldMarkParentAsFailed = !isNil(parentRunId) && childRunFailsParent({
                                status: savedFlowRun.status,
                                failParentOnFailure: savedFlowRun.failParentOnFailure,
                                willRetry: runMetadata.willRetry,
                            })
                            if (shouldMarkParentAsFailed) {
                                await markParentRunAsFailed({
                                    parentRunId,
                                    childRunId: savedFlowRun.id,
                                    childStatus: savedFlowRun.status,
                                    childFailureMessage: savedFlowRun.failedStep?.message,
                                    projectId: savedFlowRun.projectId,
                                    log,
                                })
                            }

                            if (!isNil(runMetadata.requestId)) {
                                await distributedStore.deleteKeyIfFieldValueMatches(key, 'requestId', runMetadata.requestId)
                            }
                            if (!isNil(runMetadata.finishTime)) {
                                const platformId = await projectService(log).getPlatformId(savedFlowRun.projectId)
                                await flowRunSideEffects(log).onFinish({ flowRun: savedFlowRun, platformId })
                            }

                            if (savedFlowRun.status === FlowRunStatus.PAUSED) {
                                const latestWaitpoint = await waitpointService(log).getByFlowRunId(savedFlowRun.id)
                                const isPreCompleted = !isNil(latestWaitpoint)
                                    && latestWaitpoint.status === WaitpointStatus.COMPLETED
                                if (isPreCompleted) {
                                    await resumeService(log).resumeFromWaitpointWithoutLock({
                                        flowRunId: savedFlowRun.id,
                                        waitpointId: latestWaitpoint.id,
                                        resumePayload: latestWaitpoint.resumePayload,
                                    })
                                }
                            }
                        }
                        catch (error) {
                            log.error({
                                error,
                                data: job.data,
                            }, '[runsMetadataQueue#worker] Error saving runs metadata')
                            exceptionHandler.handle(error, log)
                            throw error
                        }
                    },
                })

            },
            {
                connection: await redisConnections.create(),
                concurrency: system.getNumberOrThrow(AppSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY),
                autorun: true,
            },
        )

        await runsMetadataWorker.waitUntilReady()
    },

    async add(params: RunsMetadataUpsertData): Promise<void> {
        log.info({
            flowRun: { id: params.id },
            project: { id: params.projectId },
        }, '[runsMetadataQueue#add] Adding runs metadata to queue')
        await queue.add(params)
    },

    get(): Queue<RunsMetadataJobData> {
        return queue.get()
    },
    async close(): Promise<void> {
        if (queue.get()) {
            await queue.get().close()
        }

        if (runsMetadataWorker) {
            await runsMetadataWorker.close()
        }
    },

})

async function claimMetadataWrittenBeforeTheKeyWasScoped({ runId, projectId }: RunsMetadataJobData): Promise<RunsMetadataUpsertData | null> {
    const legacyKey = legacyRedisMetadataKey(runId)
    const legacyMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(legacyKey)
    if (isNil(legacyMetadata)) {
        return null
    }
    await distributedStore.delete(legacyKey)
    return legacyMetadata.projectId === projectId ? legacyMetadata : null
}

function buildTimeline({ existingFlowRun, runMetadata }: BuildTimelineParams): RunTimeline | undefined {
    return buildRunTimeline({
        existingTimeline: existingFlowRun.timeline,
        created: existingFlowRun.created,
        startTime: runMetadata.startTime ?? existingFlowRun.startTime,
        finishTime: runMetadata.finishTime ?? existingFlowRun.finishTime,
        provisionMs: runMetadata.provisionMs,
        bootMs: runMetadata.bootMs,
        runMs: runMetadata.runMs,
    })
}

export function childRunFailsParent({ status, failParentOnFailure, willRetry }: ChildRunFailsParentParams): boolean {
    return failParentOnFailure
        && status !== FlowRunStatus.SUCCEEDED
        && isFlowRunStateTerminal({ status, ignoreInternalError: willRetry === true })
}

export async function markParentRunAsFailed({
    parentRunId,
    childRunId,
    childStatus,
    childFailureMessage,
    projectId,
    log,
}: MarkParentRunAsFailedParams): Promise<void> {
    const flowRun = await flowRunRepo().findOneBy({
        id: parentRunId,
        projectId,
    })

    if (isNil(flowRun) || isFlowRunStateTerminal({ status: flowRun.status, ignoreInternalError: false })) {
        return
    }

    const childRunUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/runs/${childRunId}` })
    const errorPayload = {
        body: {
            status: 'error',
            data: {
                message: childFailureMessage ?? 'Subflow execution failed',
                status: childStatus,
                link: childRunUrl,
            },
        },
        headers: {},
        queryParams: {},
    }

    const existingWaitpoint = await waitpointService(log).getByFlowRunId(parentRunId)
    const result = await waitpointService(log).complete({
        flowRunId: parentRunId,
        projectId: flowRun.projectId,
        waitpointId: existingWaitpoint?.id ?? apId(),
        resumePayload: errorPayload,
    })

    if (result.completedExisting && !isNil(result.waitpoint)) {
        await resumeService(log).resumeFromWaitpoint({
            flowRunId: parentRunId,
            waitpointId: result.waitpoint.id,
            resumePayload: result.waitpoint.resumePayload,
        })
    }
}

type ChildRunFailsParentParams = {
    status: FlowRunStatus
    failParentOnFailure: boolean
    willRetry?: boolean
}

type BuildTimelineParams = {
    existingFlowRun: FlowRun
    runMetadata: RunsMetadataUpsertData
}

type MarkParentRunAsFailedParams = {
    parentRunId: string
    childRunId: string
    childStatus: FlowRunStatus
    childFailureMessage?: string
    projectId: string
    log: FastifyBaseLogger
}
