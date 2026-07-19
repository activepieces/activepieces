import { apId, isNil, sanitizeObjectForPostgresql, spreadIfDefined } from '@activepieces/core-utils'
import { FlowRun, FlowRunStatus, isFlowRunStateTerminal, RunTimeline } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock, distributedStore, redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../helper/domain-helper'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { QueueName, redisMetadataKey, RunsMetadataJobData, RunsMetadataQueueConfig, runsMetadataQueueFactory, RunsMetadataUpsertData } from '../../workers/job'
import { flowService } from '../flow/flow.service'
import { flowRunRepo } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'
import { buildRunTimeline } from './run-timeline'
import { resumeService } from './waitpoint/resume-service'
import { waitpointService } from './waitpoint/waitpoint-service'
import { Waitpoint, WaitpointStatus } from './waitpoint/waitpoint-types'

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
                const key = redisMetadataKey(job.data.runId)
                await distributedLock(log).runExclusive({
                    key: `runs_metadata_${job.data.runId}`,
                    timeoutInSeconds: 30,
                    fn: async () => {
                        try {
                            await runsMetadataQueue(log).get().removeDeduplicationKey(job.data.runId)
                            const rawRunMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(key)
                            if (isNil(rawRunMetadata) || Object.keys(rawRunMetadata).length === 0) {
                                log.info({
                                    job: { id: job.id },
                                    flowRun: { id: job.data.runId },
                                }, '[runsMetadataQueue#worker] Runs metadata not found, skipping job')
                                return
                            }
                            const runMetadata = sanitizeObjectForPostgresql(rawRunMetadata)

                            const existingFlowRun = await flowRunRepo().findOneBy({ id: job.data.runId })
                            let savedFlowRun: FlowRun
                            if (!isNil(existingFlowRun)) {
                                const timeline = buildTimeline({ existingFlowRun, runMetadata })
                                await flowRunRepo().update(job.data.runId, {
                                    ...spreadIfDefined('timeline', timeline),
                                    ...spreadIfDefined('projectId', runMetadata.projectId),
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
                                const updatedFlowRun = await flowRunRepo().findOneBy({ id: job.data.runId })
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
                                const flowId = runMetadata.flowId
                                const flowExists = !isNil(flowId) && await flowService(log).exists(flowId)
                                if (!flowExists) {
                                    log.info({
                                        job: { id: job.id },
                                        flowRun: { id: job.data.runId },
                                    }, '[runsMetadataQueue#worker] Flow does not exist (deleted), skipping job')
                                    return
                                }
                                savedFlowRun = await flowRunRepo().save(runMetadata)
                            }

                            const parentRunId = savedFlowRun.parentRunId
                            const shouldMarkParentAsFailed = savedFlowRun.failParentOnFailure && !isNil(parentRunId) && ![FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED, FlowRunStatus.QUEUED].includes(savedFlowRun.status)
                            if (shouldMarkParentAsFailed) {
                                await markParentRunAsFailed({
                                    parentRunId,
                                    childRunId: savedFlowRun.id,
                                    projectId: savedFlowRun.projectId,
                                    log,
                                })
                            }
                            else if (!isNil(parentRunId) && isFlowRunStateTerminal({ status: savedFlowRun.status, ignoreInternalError: false })) {
                                const joinWaitpoint = await waitpointService(log).getPendingByFlowRunId(parentRunId)
                                if (!isNil(joinWaitpoint) && !isNil(joinWaitpoint.expectedCount)) {
                                    await completeFanInIfDone({
                                        waitpoint: joinWaitpoint,
                                        projectId: savedFlowRun.projectId,
                                        useLock: true,
                                        log,
                                    })
                                }
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
                                else if (!isNil(latestWaitpoint) && !isNil(latestWaitpoint.expectedCount)) {
                                    await completeFanInIfDone({
                                        waitpoint: latestWaitpoint,
                                        projectId: savedFlowRun.projectId,
                                        useLock: false,
                                        log,
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

async function markParentRunAsFailed({
    parentRunId,
    childRunId,
    projectId,
    log,
}: MarkParentRunAsFailedParams): Promise<void> {
    const flowRun = await flowRunRepo().findOneBy({
        id: parentRunId,
    })

    if (isNil(flowRun) || isFlowRunStateTerminal({ status: flowRun.status, ignoreInternalError: false })) {
        return
    }

    const childRunUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/runs/${childRunId}` })
    const errorPayload = {
        body: {
            status: 'error',
            data: {
                message: 'Subflow execution failed',
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

// COUNT over the indexed parentRunId is the sole source of truth: idempotent under BullMQ
// retries and concurrent completions, and complete() (pessimistic-locked, WHERE status=PENDING)
// makes the resume exactly-once. Called from the child's terminal upload (useLock=true, it holds
// the child's lock, not the parent's) and from the parent's own PAUSED upload (useLock=false, it
// already holds the parent's lock) — the latter also seals the finish-before-pause race.
// ponytail: COUNT runs on every join completion, O(n) per child; fine at ADR-0009's bounded
// fan-out over idx_run_parent_run_id. Add a counter/Redis fast-path only if a large fan-out
// measurably regresses.
async function completeFanInIfDone({ waitpoint, projectId, useLock, log }: CompleteFanInParams): Promise<void> {
    if (isNil(waitpoint.expectedCount)) {
        return
    }
    const tally = await countTerminalChildren({ parentRunId: waitpoint.flowRunId, projectId })
    if (tally.completed + tally.failed < waitpoint.expectedCount) {
        return
    }
    const result = await waitpointService(log).complete({
        flowRunId: waitpoint.flowRunId,
        projectId,
        waitpointId: waitpoint.id,
        resumePayload: fanInResumePayload(tally),
    })
    if (result.completedExisting && !isNil(result.waitpoint)) {
        const resumeParams = {
            flowRunId: waitpoint.flowRunId,
            waitpointId: result.waitpoint.id,
            resumePayload: result.waitpoint.resumePayload,
        }
        if (useLock) {
            await resumeService(log).resumeFromWaitpoint(resumeParams)
        }
        else {
            await resumeService(log).resumeFromWaitpointWithoutLock(resumeParams)
        }
    }
}

export async function countTerminalChildren({ parentRunId, projectId }: CountTerminalChildrenParams): Promise<FanInTally> {
    const rows = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow_run.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('flow_run.parentRunId = :parentRunId', { parentRunId })
        .andWhere('flow_run.projectId = :projectId', { projectId })
        .andWhere('flow_run.status IN (:...statuses)', { statuses: TERMINAL_CHILD_STATUSES })
        .groupBy('flow_run.status')
        .getRawMany<{ status: FlowRunStatus, count: string }>()

    return rows.reduce<FanInTally>((tally, row) => {
        const count = Number(row.count)
        return row.status === FlowRunStatus.SUCCEEDED
            ? { ...tally, completed: tally.completed + count }
            : { ...tally, failed: tally.failed + count }
    }, { completed: 0, failed: 0 })
}

function fanInResumePayload({ completed, failed }: FanInTally): { body: { status: string, data: FanInTally }, headers: Record<string, string>, queryParams: Record<string, string> } {
    return { body: { status: 'success', data: { completed, failed } }, headers: {}, queryParams: {} }
}

const TERMINAL_CHILD_STATUSES = Object.values(FlowRunStatus).filter((status) =>
    isFlowRunStateTerminal({ status, ignoreInternalError: false }))

type CompleteFanInParams = {
    waitpoint: Waitpoint
    projectId: string
    useLock: boolean
    log: FastifyBaseLogger
}

type CountTerminalChildrenParams = {
    parentRunId: string
    projectId: string
}

type FanInTally = {
    completed: number
    failed: number
}

type BuildTimelineParams = {
    existingFlowRun: FlowRun
    runMetadata: RunsMetadataUpsertData
}

type MarkParentRunAsFailedParams = {
    parentRunId: string
    childRunId: string
    projectId: string
    log: FastifyBaseLogger
}
