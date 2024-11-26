import { exceptionHandler, logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    Cursor,
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
    MAX_LOG_SIZE,
    PauseMetadata,
    PauseType,
    ProgressUpdateType,
    ProjectId,
    RunEnvironment,
    SeekPage,
    spreadIfDefined,
} from '@activepieces/shared'
import { In } from 'typeorm'
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
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { getJobPriority } from '../../workers/queue/queue-manager'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from '../step-run/sample-data.service'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'

export const flowRunRepo = repoFactory<FlowRun>(FlowRunEntity)

export const flowRunService = {
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
        const oldFlowRun = await flowRunService.getOneOrThrow({
            id: flowRunId,
            projectId,
        })

        const newFlowRun = {
            ...oldFlowRun,
            id: apId(),
            status: FlowRunStatus.RUNNING,
            startTime: new Date().toISOString(),
            created: new Date().toISOString(),
        }

        await flowRunRepo().save(newFlowRun)

        switch (strategy) {
            case FlowRetryStrategy.FROM_FAILED_STEP:
                return flowRunService.addToQueue({
                    flowRunId: newFlowRun.id,
                    executionType: ExecutionType.RESUME,
                    progressUpdateType: ProgressUpdateType.NONE,
                    checkRequestId: false,
                })
            case FlowRetryStrategy.ON_LATEST_VERSION: {
                const payload = await updateFlowRunToLatestFlowVersionIdAndReturnPayload(newFlowRun.id)
                return flowRunService.addToQueue({
                    payload,
                    flowRunId: newFlowRun.id,
                    executionType: ExecutionType.BEGIN,
                    progressUpdateType: ProgressUpdateType.NONE,
                    checkRequestId: false,
                })
            }
        }
    },
    async bulkRetry({ projectId, flowRunIds, strategy, status, flowId, createdAfter, createdBefore }: BulkRetryParams): Promise<(FlowRun | null)[]> {
        const filteredFlowRunIds = await filterFlowRunsAndApplyFilters(projectId, flowRunIds, status, flowId, createdAfter, createdBefore)
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
        logger.info(`[FlowRunService#resume] flowRunId=${flowRunId}`)

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
            return flowRunService.start({
                payload,
                flowRunId: flowRunToResume.id,
                projectId: flowRunToResume.projectId,
                flowVersionId: flowRunToResume.flowVersionId,
                synchronousHandlerId: returnHandlerId(pauseMetadata, requestId),
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
        await flowRunSideEffects.finish(flowRun)
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
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)

        const flow = await flowService.getOneOrThrow({
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
        })

        flowRun.status = FlowRunStatus.RUNNING

        const savedFlowRun = await flowRunRepo().save(flowRun)
        const priority = await getJobPriority(savedFlowRun.projectId, synchronousHandlerId)
        await flowRunSideEffects.start({
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
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)

        const sampleData = await sampleDataService.getOrReturnEmpty({
            projectId,
            flowVersion,
            stepName: flowVersion.trigger.name,
        })
        return this.start({
            projectId,
            flowVersionId,
            payload: sampleData,
            environment: RunEnvironment.TESTING,
            executionType: ExecutionType.BEGIN,
            synchronousHandlerId: webhookResponseWatcher.getServerId(),
            httpRequestId: undefined,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
        })
    },

    async pause(params: PauseParams): Promise<void> {
        logger.info(
            `[FlowRunService#pause] flowRunId=${params.flowRunId} pauseType=${params.pauseMetadata.type}`,
        )

        const { flowRunId, pauseMetadata } = params
        await flowRunRepo().update(flowRunId, {
            status: FlowRunStatus.PAUSED,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pauseMetadata: pauseMetadata as any,
        })

        const flowRun = await flowRunRepo().findOneByOrFail({ id: flowRunId })

        await flowRunSideEffects.pause({ flowRun })
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
            const { data } = await fileService.getDataOrThrow({
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
        if (executionStateContentLength > MAX_LOG_SIZE || (!isNil(executionState) && executionState.byteLength > MAX_LOG_SIZE)) {
            const errors = new Error(
                'Execution Output is too large, maximum size is ' + MAX_LOG_SIZE,
            )
            exceptionHandler.handle(errors)
            throw errors
        }
        const newLogsFileId = logsFileId ?? apId()
        const file = await fileService.save({
            fileId: newLogsFileId,
            projectId,
            data: executionState ?? null,
            size: executionStateContentLength,
            type: FileType.FLOW_RUN_LOG,
            compression: FileCompression.NONE,
        })
        if (isNil(logsFileId)) {
            await flowRunRepo().update(flowRunId, {
                logsFileId: newLogsFileId,
            })
        }
        return getUploadUrl(file.s3Key, executionState, executionStateContentLength)
    },
}

async function filterFlowRunsAndApplyFilters(
    projectId: ProjectId,
    flowRunIds?: FlowRunId[],
    status?: FlowRunStatus[],
    flowId?: FlowId[],
    createdAfter?: string,
    createdBefore?: string,
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

    const flowRuns = await query.getMany()
    return flowRuns.map(flowRun => flowRun.id)
}


const getUploadUrl = async (s3Key: string | undefined, executionDate: unknown, contentLength: number): Promise<string | undefined> => {
    if (!isNil(executionDate)) {
        return undefined
    }
    assertNotNullOrUndefined(s3Key, 's3Key')
    return s3Helper.putS3SignedUrl(s3Key, contentLength)
}

const getFlowRunOrCreate = async (
    params: GetOrCreateParams,
): Promise<Partial<FlowRun>> => {
    const { id, projectId, flowId, flowVersionId, flowDisplayName, environment } =
        params

    if (id) {
        return flowRunService.getOneOrThrow({
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
): Promise<unknown> {
    const flowRun = await flowRunService.getOnePopulatedOrThrow({
        id: flowRunId,
        projectId: undefined,
    })
    const flowVersion = await flowVersionService.getLatestLockedVersionOrThrow(
        flowRun.flowId,
    )
    await flowRunRepo().update(flowRunId, {
        flowVersionId: flowVersion.id,
    })
    return flowRun.steps ? flowRun.steps[flowVersion.trigger.name]?.output : undefined
}

function returnHandlerId(pauseMetadata: PauseMetadata | undefined, requestId: string | undefined): string {
    const handlerId = webhookResponseWatcher.getServerId()
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
}
type AddToQueueParams = {
    flowRunId: FlowRunId
    requestId?: string
    progressUpdateType: ProgressUpdateType
    payload?: unknown
    executionType: ExecutionType
    checkRequestId: boolean
}