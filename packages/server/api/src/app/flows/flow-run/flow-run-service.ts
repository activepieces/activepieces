import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
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
        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<FlowRun>(data, newCursor)
    },
    async retry({ flowRunId, strategy, projectId }: RetryParams): Promise<FlowRun | null> {
        const oldFlowRun = await flowRunService(log).getOneOrThrow({
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
                const newFlowRun = {
                    ...oldFlowRun,
                    id: apId(),
                    status: FlowRunStatus.RUNNING,
                    startTime: new Date().toISOString(),
                    created: new Date().toISOString(),
                }
                await flowRunRepo().save(newFlowRun)

                const payload = await updateFlowRunToLatestFlowVersionIdAndReturnPayload(newFlowRun.id, log)
                return flowRunService(log).addToQueue({
                    payload,
                    flowRunId: newFlowRun.id,
                    executionType: ExecutionType.BEGIN,
                    progressUpdateType: ProgressUpdateType.NONE,
                    checkRequestId: false,
                })
            }
        }
    },
    async bulkRetry({ projectId, flowRunIds, strategy, status, flowId, createdAfter, createdBefore, excludeFlowRunIds }: BulkRetryParams): Promise<(FlowRun | null)[]> {
        const filteredFlowRunIds = await filterFlowRunsAndApplyFilters(projectId, flowRunIds, status, flowId, createdAfter, createdBefore, excludeFlowRunIds)
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
                flowRunId: flowRunToResume.id,
                projectId: flowRunToResume.projectId,
                flowVersionId: flowRunToResume.flowVersionId,
                synchronousHandlerId: returnHandlerId(pauseMetadata, requestId, log),
                httpRequestId: requestId,
                progressUpdateType,
                executionType,
                environment: RunEnvironment.PRODUCTION,
            })
        }
        return null
    },
    async updateStatus({
        flowRunId,
        status,
        tasks,
        projectId,
        tags,
        duration,
    }: FinishParams): Promise<FlowRun> {

        await flowRunRepo().update({
            id: flowRunId,
            projectId,
        }, {
            status,
            ...spreadIfDefined('tasks', tasks),
            ...spreadIfDefined('duration', duration ? Math.floor(Number(duration)) : undefined),
            terminationReason: undefined,
            tags,
            finishTime: new Date().toISOString(),
        })


        const flowRun = await flowRunRepo().findOneByOrFail({ id: flowRunId })
        await flowRunSideEffects(log).finish(flowRun)
        return flowRun
    },

    async start({
        projectId,
        flowVersionId,
        flowRunId,
        payload,
        environment,
        executionType,
        synchronousHandlerId,
        progressUpdateType,
        httpRequestId,
    }: StartParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)

        const flow = await flowService(log).getOneOrThrow({
            id: flowVersion.flowId,
            projectId,
        })

        const flowRun = await getFlowRunOrCreate({
            id: flowRunId,
            projectId: flow.projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment,
            flowDisplayName: flowVersion.displayName,
        }, log)

        flowRun.status = FlowRunStatus.RUNNING

        const savedFlowRun = await flowRunRepo().save(flowRun)
        const priority = await getJobPriority(synchronousHandlerId)
        await flowRunSideEffects(log).start({
            flowRun: savedFlowRun,
            httpRequestId,
            payload,
            priority,
            synchronousHandlerId,
            executionType,
            progressUpdateType,
        })

        return savedFlowRun
    },

    async test({ projectId, flowVersionId }: TestParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)

        const sampleData = await sampleDataService(log).getOrReturnEmpty({
            projectId,
            flowVersion,
            stepName: flowVersion.trigger.name,
            fileType: FileType.SAMPLE_DATA,
        })
        return this.start({
            projectId,
            flowVersionId,
            payload: sampleData,
            environment: RunEnvironment.TESTING,
            executionType: ExecutionType.BEGIN,
            synchronousHandlerId: engineResponseWatcher(log).getServerId(),
            httpRequestId: undefined,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
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
            flowRunId: flowRun.id,
            projectId: flowRun.projectId,
            flowVersionId: flowRun.flowVersionId,
            synchronousHandlerId,
            httpRequestId: requestId,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            executionType: ExecutionType.RESUME,
            environment: RunEnvironment.PRODUCTION,
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

const getFlowRunOrCreate = async (
    params: GetOrCreateParams,
    log: FastifyBaseLogger,
): Promise<Partial<FlowRun>> => {
    const { id, projectId, flowId, flowVersionId, flowDisplayName, environment } =
        params

    if (id) {
        return flowRunService(log).getOneOrThrow({
            id,
            projectId,
        })
    }

    return {
        id: apId(),
        projectId,
        flowId,
        flowVersionId,
        environment,
        flowDisplayName,
        startTime: new Date().toISOString(),
    }
}

async function updateFlowRunToLatestFlowVersionIdAndReturnPayload(
    flowRunId: FlowRunId,
    log: FastifyBaseLogger,
): Promise<unknown> {
    const flowRun = await flowRunService(log).getOnePopulatedOrThrow({
        id: flowRunId,
        projectId: undefined,
    })
    const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(
        flowRun.flowId,
    )
    await flowRunRepo().update(flowRunId, {
        flowVersionId: flowVersion.id,
    })
    return flowRun.steps ? flowRun.steps[flowVersion.trigger.name]?.output : undefined
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

type UpdateLogs = {
    flowRunId: FlowRunId
    logsFileId: string | undefined
    projectId: ProjectId
    executionStateString: string | undefined
    executionStateContentLength: number
}

type FinishParams = {
    flowRunId: FlowRunId
    projectId: string
    status: FlowRunStatus
    tasks: number | undefined
    duration: number | undefined
    tags: string[]
}

type GetOrCreateParams = {
    id?: FlowRunId
    projectId: ProjectId
    flowId: FlowId
    flowVersionId: FlowVersionId
    flowDisplayName: string
    environment: RunEnvironment
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
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

type StartParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    flowRunId?: FlowRunId
    environment: RunEnvironment
    payload: unknown
    synchronousHandlerId: string | undefined
    httpRequestId: string | undefined
    progressUpdateType: ProgressUpdateType
    executionType: ExecutionType
}

type TestParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
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
}
type AddToQueueParams = {
    flowRunId: FlowRunId
    requestId?: string
    progressUpdateType: ProgressUpdateType
    payload?: unknown
    executionType: ExecutionType
    checkRequestId: boolean
}