import { AppSystemProp, exceptionHandler, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    Cursor,
    EngineHttpResponse,
    ErrorCode,
    ExecutionType,
    ExecutioOutputFile,
    FileCompression,
    FileType,
    FlowId,
    FlowRetryStrategy,
    FlowRun,
    FlowRunId,
    FlowRunStatus,
    FlowVersionId,
    isNil,
    PauseMetadata,
    PauseType,
    ProgressUpdateType,
    ProjectId,
    RunEnvironment,
    SampleDataFileType,
    SeekPage,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In, Not } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import {
    APArrayContains,
} from '../../database/database-connection'
import { fileService } from '../../file/file.service'
import { s3Helper } from '../../file/s3-helper'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { getJobPriority } from '../../workers/queue/queue-manager'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from '../step-run/sample-data.service'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'
export const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000
export const flowRunRepo = repoFactory<FlowRun>(FlowRunEntity)
const maxFileSizeInBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024

export const flowRunService = (log: FastifyBaseLogger) => ({
    async list({
        projectId,
        flowId,
        status,
        cursor,
        limit,
        tags,
        createdAfter,
        createdBefore,
        failedStepName,
    }: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator<FlowRun>({
            entity: FlowRunEntity,
            query: {
                limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        let query = flowRunRepo().createQueryBuilder('flow_run').where({
            projectId,
            environment: RunEnvironment.PRODUCTION,
        })
        if (flowId) {
            query = query.andWhere({
                flowId: In(flowId),
            })
        }
        if (status) {
            query = query.andWhere({
                status: In(status),
            })
        }
        if (createdAfter) {
            query = query.andWhere('flow_run.created >= :createdAfter', {
                createdAfter,
            })
        }
        if (createdBefore) {
            query = query.andWhere('flow_run.created <= :createdBefore', {
                createdBefore,
            })
        }
        if (tags) {
            query = query.andWhere(APArrayContains('tags', tags))
        }

        if (!isNil(failedStepName)) {
            query = query.andWhere({
                failedStepName,
            })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<FlowRun>(data, newCursor)
    },
    async retry({ flowRunId, strategy, projectId }: RetryParams): Promise<FlowRun | null> {
        const oldFlowRun = await flowRunService(log).getOnePopulatedOrThrow({
            id: flowRunId,
            projectId,
        })

        switch (strategy) {
            case FlowRetryStrategy.FROM_FAILED_STEP:
                return flowRunService(log).addToQueue({
                    flowRunId: oldFlowRun.id,
                    executionType: ExecutionType.RESUME,
                    progressUpdateType: ProgressUpdateType.NONE,
                    checkRequestId: false,
                })
            case FlowRetryStrategy.ON_LATEST_VERSION: {
                const latestFlowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(
                    oldFlowRun.flowId,
                )
                const payload = oldFlowRun.steps ? oldFlowRun.steps[latestFlowVersion.trigger.name]?.output : undefined
                return flowRunService(log).start({
                    payload,
                    projectId: oldFlowRun.projectId,
                    flowVersionId: latestFlowVersion.id,
                    synchronousHandlerId: undefined,
                    parentRunId: oldFlowRun.parentRunId,
                    httpRequestId: undefined,
                    progressUpdateType: ProgressUpdateType.NONE,
                    executionType: ExecutionType.BEGIN,
                    environment: RunEnvironment.PRODUCTION,
                    executeTrigger: false,
                    failParentOnFailure: oldFlowRun.failParentOnFailure,
                })
            }
        }
    },
    async existsBy(runId: FlowRunId): Promise<boolean> {
        return flowRunRepo().existsBy({ id: runId })
    },
    async bulkRetry({ projectId, flowRunIds, strategy, status, flowId, createdAfter, createdBefore, excludeFlowRunIds, failedStepName }: BulkRetryParams): Promise<(FlowRun | null)[]> {
        const filteredFlowRunIds = await filterFlowRunsAndApplyFilters(projectId, flowRunIds, status, flowId, createdAfter, createdBefore, excludeFlowRunIds, failedStepName)
        return Promise.all(filteredFlowRunIds.map(flowRunId => this.retry({ flowRunId, strategy, projectId })))
    },
    async addToQueue({
        flowRunId,
        payload,
        requestId,
        progressUpdateType,
        executionType,
        checkRequestId,
    }: AddToQueueParams): Promise<FlowRun | null> {
        log.info({
            flowRunId,
        }, '[FlowRunService#resume] adding flow run to queue')

        const flowRunToResume = await flowRunRepo().findOneBy({
            id: flowRunId,
        })

        if (isNil(flowRunToResume)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_NOT_FOUND,
                params: {
                    id: flowRunId,
                },
            })
        }
        const pauseMetadata = flowRunToResume.pauseMetadata
        const matchRequestId = isNil(pauseMetadata) || (pauseMetadata.type === PauseType.WEBHOOK && requestId === pauseMetadata.requestId)
        if (matchRequestId || !checkRequestId) {
            return flowRunService(log).start({
                payload,
                existingFlowRunId: flowRunToResume.id,
                projectId: flowRunToResume.projectId,
                flowVersionId: flowRunToResume.flowVersionId,
                synchronousHandlerId: returnHandlerId(pauseMetadata, requestId, log),
                httpRequestId: flowRunToResume.pauseMetadata?.requestIdToReply ?? undefined,
                progressUpdateType,
                executeTrigger: false,
                executionType,
                environment: !isNil(flowRunToResume.stepNameToTest) ? RunEnvironment.TESTING : RunEnvironment.PRODUCTION,
                parentRunId: flowRunToResume.parentRunId,
                failParentOnFailure: flowRunToResume.failParentOnFailure,
                stepNameToTest: flowRunToResume.stepNameToTest,
            })
        }
        return null
    },
    updateRunStatusAsync({ flowRunId, status }: UpdateRunStatusParams): void {
        rejectedPromiseHandler(flowRunRepo().update(flowRunId, { status }), log)
    },
    async updateRun({
        flowRunId,
        status,
        tasks,
        projectId,
        tags,
        duration,
        failedStepName,
    }: FinishParams): Promise<FlowRun> {
        log.info({
            flowRunId,
            status,
            tasks,
            duration,
            failedStepName,
        }, '[FlowRunService#updateRun]')

        await flowRunRepo().update({
            id: flowRunId,
            projectId,
        }, {
            status,
            ...spreadIfDefined('tasks', tasks),
            ...spreadIfDefined('duration', duration ? Math.floor(Number(duration)) : undefined),
            tags,
            finishTime: new Date().toISOString(),
            failedStepName: failedStepName ?? undefined,
        })


        const flowRun = await flowRunRepo().findOneByOrFail({ id: flowRunId })
        await flowRunSideEffects(log).finish(flowRun)
        return flowRun
    },

    async start({
        projectId,
        flowVersionId,
        existingFlowRunId,
        payload,
        environment,
        executeTrigger,
        executionType,
        synchronousHandlerId,
        progressUpdateType,
        httpRequestId,
        parentRunId,
        failParentOnFailure,
        stepNameToTest,
        sampleData,
    }: StartParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)

        const flow = await flowService(log).getOneOrThrow({
            id: flowVersion.flowId,
            projectId,
        })

        const flowRun = await getOrCreate({
            existingFlowRunId,
            projectId: flow.projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            httpRequestId,
            environment,
            flowDisplayName: flowVersion.displayName,
            parentRunId,
            failParentOnFailure,
            stepNameToTest,
            log,
        })

        const priority = await getJobPriority(synchronousHandlerId)
        await flowRunSideEffects(log).start({
            flowRun,
            httpRequestId,
            payload,
            priority,
            synchronousHandlerId,
            executeTrigger,
            executionType,
            progressUpdateType,
            stepNameToTest,
            sampleData,
        })

        return flowRun
    },

    async test({ projectId, flowVersionId, parentRunId, stepNameToTest }: TestParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)

        const triggerPayload = await sampleDataService(log).getOrReturnEmpty({
            projectId,
            flowVersion,
            stepName: flowVersion.trigger.name,
            type: SampleDataFileType.OUTPUT,
        })
        return this.start({
            projectId,
            flowVersionId,
            parentRunId,
            payload: triggerPayload,
            environment: RunEnvironment.TESTING,
            executionType: ExecutionType.BEGIN,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            executeTrigger: false,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            failParentOnFailure: undefined,
            stepNameToTest,
            sampleData: !isNil(stepNameToTest) ? await sampleDataService(log).getSampleDataForFlow(projectId, flowVersion, SampleDataFileType.OUTPUT) : undefined,
        })
    },

    async pause(params: PauseParams): Promise<void> {
        log.info({
            flowRunId: params.flowRunId,
            pauseType: params.pauseMetadata.type,
        }, '[FlowRunService] pausing flow run')

        const { flowRunId, pauseMetadata } = params
        await flowRunRepo().update(flowRunId, {
            status: FlowRunStatus.PAUSED,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pauseMetadata: pauseMetadata as any,
        })

        const flowRun = await flowRunRepo().findOneByOrFail({ id: flowRunId })

        await flowRunSideEffects(log).pause({ flowRun })
    },

    async getOneOrThrow(params: GetOneParams): Promise<FlowRun> {
        const flowRun = await flowRunRepo().findOneBy({
            projectId: params.projectId,
            id: params.id,
        })

        if (isNil(flowRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_NOT_FOUND,
                params: {
                    id: params.id,
                },
            })
        }

        return flowRun
    },
    async getOnePopulatedOrThrow(params: GetOneParams): Promise<FlowRun> {
        const flowRun = await this.getOneOrThrow(params)
        let steps = {}
        if (!isNil(flowRun.logsFileId)) {
            const { data } = await fileService(log).getDataOrThrow({
                fileId: flowRun.logsFileId,
                projectId: flowRun.projectId,
            })

            const serializedExecutionOutput = data.toString('utf-8')
            const executionOutput: ExecutioOutputFile = JSON.parse(
                serializedExecutionOutput,
            )
            steps = executionOutput.executionState.steps
        }
        return {
            ...flowRun,
            steps,
        }
    },
    async updateLogsAndReturnUploadUrl({ flowRunId, logsFileId, projectId, executionStateString, executionStateContentLength }: UpdateLogs): Promise<string | undefined> {
        const executionState = executionStateString ? Buffer.from(executionStateString) : undefined
        if (executionStateContentLength > maxFileSizeInBytes || (!isNil(executionState) && executionState.byteLength > maxFileSizeInBytes)) {
            const errors = new Error(
                'Execution Output is too large, maximum size is ' + maxFileSizeInBytes,
            )
            exceptionHandler.handle(errors, log)
            throw errors
        }
        const newLogsFileId = logsFileId ?? apId()
        const file = await fileService(log).save({
            fileId: newLogsFileId,
            projectId,
            data: executionState ?? null,
            size: executionStateContentLength,
            type: FileType.FLOW_RUN_LOG,
            compression: FileCompression.NONE,
            metadata: {
                flowRunId,
                projectId,
            },
        })
        if (isNil(logsFileId)) {
            await flowRunRepo().update(flowRunId, {
                logsFileId: newLogsFileId,
            })
        }
        return getUploadUrl(file.s3Key, executionState, executionStateContentLength, log)
    },
    async handleSyncResumeFlow({ runId, payload, requestId }: { runId: string, payload: unknown, requestId: string }) {
        const flowRun = await flowRunService(log).getOnePopulatedOrThrow({
            id: runId,
            projectId: undefined,
        })
        const synchronousHandlerId = engineResponseWatcher(log).getServerId()
        const matchRequestId = isNil(flowRun.pauseMetadata) || (flowRun.pauseMetadata.type === PauseType.WEBHOOK && requestId === flowRun.pauseMetadata.requestId)
        assertNotNullOrUndefined(synchronousHandlerId, 'synchronousHandlerId is required for sync resume request is required')
        if (!matchRequestId) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            }
        }
        if (flowRun.status !== FlowRunStatus.PAUSED) {
            return {
                status: StatusCodes.CONFLICT,
                body: { 'message': 'Flow run is not paused', 'flowRunStatus': flowRun.status },
                headers: {},
            }
        }
        await flowRunService(log).start({
            payload,
            existingFlowRunId: flowRun.id,
            projectId: flowRun.projectId,
            flowVersionId: flowRun.flowVersionId,
            synchronousHandlerId,
            httpRequestId: requestId,
            executeTrigger: false,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            executionType: ExecutionType.RESUME,
            environment: RunEnvironment.PRODUCTION,
            parentRunId: flowRun.parentRunId,
            failParentOnFailure: flowRun.failParentOnFailure,
        })
        return engineResponseWatcher(log).oneTimeListener<EngineHttpResponse>(requestId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
})

async function filterFlowRunsAndApplyFilters(
    projectId: ProjectId,
    flowRunIds?: FlowRunId[],
    status?: FlowRunStatus[],
    flowId?: FlowId[],
    createdAfter?: string,
    createdBefore?: string,
    excludeFlowRunIds?: FlowRunId[],
    failedStepName?: string,
): Promise<FlowRunId[]> {
    let query = flowRunRepo().createQueryBuilder('flow_run').where({
        projectId,
        environment: RunEnvironment.PRODUCTION,
    })

    if (!isNil(flowRunIds) && flowRunIds.length > 0) {
        query = query.andWhere({
            id: In(flowRunIds),
        })
    }
    if (flowId && flowId.length > 0) {
        query = query.andWhere({
            flowId: In(flowId),
        })
    }
    if (status && status.length > 0) {
        query = query.andWhere({
            status: In(status),
        })
    }
    if (createdAfter) {
        query = query.andWhere('flow_run.created >= :createdAfter', {
            createdAfter,
        })
    }
    if (createdBefore) {
        query = query.andWhere('flow_run.created <= :createdBefore', {
            createdBefore,
        })
    }
    if (excludeFlowRunIds && excludeFlowRunIds.length > 0) {
        query = query.andWhere({
            id: Not(In(excludeFlowRunIds)),
        })
    }

    if (failedStepName) {
        query = query.andWhere('flow_run.failedStepName = :failedStepName', {
            failedStepName,
        })
    }

    const flowRuns = await query.getMany()
    return flowRuns.map(flowRun => flowRun.id)
}


const getUploadUrl = async (s3Key: string | undefined, executionDate: unknown, contentLength: number, log: FastifyBaseLogger): Promise<string | undefined> => {
    if (!isNil(executionDate)) {
        return undefined
    }
    assertNotNullOrUndefined(s3Key, 's3Key')
    return s3Helper(log).putS3SignedUrl(s3Key, contentLength)
}


function returnHandlerId(pauseMetadata: PauseMetadata | undefined, requestId: string | undefined, log: FastifyBaseLogger): string {
    const handlerId = engineResponseWatcher(log).getServerId()
    if (isNil(pauseMetadata)) {
        return handlerId
    }

    if (pauseMetadata.type === PauseType.WEBHOOK && requestId === pauseMetadata.requestId && pauseMetadata.handlerId) {
        return pauseMetadata.handlerId
    }
    else {
        return handlerId
    }
}

async function getOrCreate({
    existingFlowRunId,
    projectId,
    flowId,
    flowVersionId,
    flowDisplayName,
    environment,
    parentRunId,
    failParentOnFailure,
    stepNameToTest,
    log,
}: GetOrCreateParams): Promise<FlowRun> {
    if (existingFlowRunId) {
        return flowRunService(log).getOneOrThrow({
            id: existingFlowRunId,
            projectId,
        })
    }

    return flowRunRepo().save({
        id: apId(),
        projectId,
        flowId,
        flowVersionId,
        environment,
        flowDisplayName,
        startTime: new Date().toISOString(),
        parentRunId,
        failParentOnFailure: failParentOnFailure ?? true,
        status: FlowRunStatus.QUEUED,
        stepNameToTest,
    })
}

type UpdateLogs = {
    flowRunId: FlowRunId
    logsFileId: string | undefined
    projectId: ProjectId
    executionStateString: string | undefined
    executionStateContentLength: number
}

type UpdateRunStatusParams = {
    flowRunId: FlowRunId
    status: FlowRunStatus
}

type FinishParams = {
    flowRunId: FlowRunId
    projectId: string
    status: FlowRunStatus
    tasks: number | undefined
    duration: number | undefined
    tags: string[]
    failedStepName?: string | undefined
}

type GetOrCreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    parentRunId?: FlowRunId
    failParentOnFailure?: boolean
    stepNameToTest?: string
    existingFlowRunId?: FlowRunId
    flowId: FlowId
    httpRequestId: string | undefined
    flowDisplayName: string
    environment: RunEnvironment
    log: FastifyBaseLogger
}

type ListParams = {
    projectId: ProjectId
    flowId: FlowId[] | undefined
    status: FlowRunStatus[] | undefined
    cursor: Cursor | null
    tags?: string[]
    limit: number
    createdAfter?: string
    createdBefore?: string
    failedStepName?: string
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

type StartParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    parentRunId?: FlowRunId
    failParentOnFailure?: boolean
    existingFlowRunId?: FlowRunId
    environment: RunEnvironment
    payload: unknown
    executeTrigger: boolean
    synchronousHandlerId: string | undefined
    httpRequestId: string | undefined
    progressUpdateType: ProgressUpdateType
    executionType: ExecutionType
    stepNameToTest?: string
    sampleData?: Record<string, unknown>
}   

type TestParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    parentRunId?: FlowRunId
    stepNameToTest?: string
}

type PauseParams = {
    flowRunId: FlowRunId
    pauseMetadata: PauseMetadata
}

type RetryParams = {
    flowRunId: FlowRunId
    strategy: FlowRetryStrategy
    projectId: ProjectId
}

type BulkRetryParams = {
    projectId: ProjectId
    flowRunIds?: FlowRunId[]
    strategy: FlowRetryStrategy
    status?: FlowRunStatus[]
    flowId?: FlowId[]
    createdAfter?: string
    createdBefore?: string
    excludeFlowRunIds?: FlowRunId[]
    failedStepName?: string
}
type AddToQueueParams = {
    flowRunId: FlowRunId
    requestId?: string
    progressUpdateType: ProgressUpdateType
    payload?: unknown
    executionType: ExecutionType
    checkRequestId: boolean
}