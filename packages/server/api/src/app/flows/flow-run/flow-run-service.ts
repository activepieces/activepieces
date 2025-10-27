import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    Cursor,
    EngineHttpResponse,
    ErrorCode,
    ExecutionType,
    FlowId,
    FlowRetryStrategy,
    FlowRun,
    FlowRunId,
    FlowRunStatus,
    FlowVersionId,
    isFlowRunStateTerminal,
    isNil,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PauseMetadata,
    PauseType,
    PlatformId,
    ProgressUpdateType,
    ProjectId,
    RunEnvironment,
    SampleDataFileType,
    SeekPage,
    spreadIfDefined,
    UploadLogsBehavior,
    WorkerJobType,
} from '@activepieces/shared'
import { context, propagation, trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import {
    APArrayContains,
} from '../../database/database-connection'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { jobQueue } from '../../workers/queue/job-queue'
import { JobType } from '../../workers/queue/queue-manager'
import { sampleDataService } from '../step-run/sample-data.service'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'
import { runsMetadataQueue } from './flow-runs-queue'
import { flowRunLogsService } from './logs/flow-run-logs-service'


const tracer = trace.getTracer('flow-run-service')
export const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000
export const flowRunRepo = repoFactory<FlowRun>(FlowRunEntity)
const USE_SIGNED_URL = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS) ?? false

export const flowRunService = (log: FastifyBaseLogger) => ({
    async list(params: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator<FlowRun>({
            entity: FlowRunEntity,
            query: {
                limit: params.limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })


        let query = queryBuilderForFlowRun(flowRunRepo()).where({
            projectId: params.projectId,
            environment: RunEnvironment.PRODUCTION,
        })

        if (params.flowId) {
            query = query.andWhere({
                flowId: In(params.flowId),
            })
        }
        if (params.status) {
            query = query.andWhere({
                status: In(params.status),
            })
        }
        if (params.createdAfter) {
            query = query.andWhere('flow_run.created >= :createdAfter', {
                createdAfter: params.createdAfter,
            })
        }
        if (params.createdBefore) {
            query = query.andWhere('flow_run.created <= :createdBefore', {
                createdBefore: params.createdBefore,
            })
        }
        if (params.tags) {
            query = query.andWhere(APArrayContains('tags', params.tags))
        }

        if (!isNil(params.failedStepName)) {
            query = query.andWhere({
                failedStepName: params.failedStepName,
            })
        }
        if (params.flowRunIds) {
            query = query.andWhere({
                id: In(params.flowRunIds),
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
                await flowRunRepo().update({
                    id: oldFlowRun.id,
                    projectId: oldFlowRun.projectId,
                }, {
                    status: FlowRunStatus.QUEUED,
                })
                return flowRunService(log).resume({
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
                return this.start({
                    flowId: oldFlowRun.flowId,
                    payload,
                    platformId: await projectService.getPlatformId(oldFlowRun.projectId),
                    executionType: ExecutionType.BEGIN,
                    progressUpdateType: ProgressUpdateType.NONE,
                    synchronousHandlerId: undefined,
                    httpRequestId: undefined,
                    executeTrigger: false,
                    environment: oldFlowRun.environment,
                    flowVersionId: latestFlowVersion.id,
                    projectId: oldFlowRun.projectId,
                    failParentOnFailure: oldFlowRun.failParentOnFailure,
                    parentRunId: oldFlowRun.id,
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
    async resume({
        flowRunId,
        payload,
        requestId,
        progressUpdateType,
        executionType,
        checkRequestId,
    }: ResumeWebhookParams): Promise<FlowRun | null> {
        log.info({
            runId: flowRunId,
        }, '[FlowRunService#resume] adding flow run to queue')

        const flowRun = await queryBuilderForFlowRun(flowRunRepo()).where({ id: flowRunId }).getOne()

        if (isNil(flowRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_NOT_FOUND,
                params: {
                    id: flowRunId,
                },
            })
        }


        const pauseMetadata = flowRun.pauseMetadata
        const matchRequestId = isNil(pauseMetadata) || (pauseMetadata.type === PauseType.WEBHOOK && requestId === pauseMetadata.requestId)
        const platformId = await projectService.getPlatformId(flowRun.projectId)
        if (matchRequestId || !checkRequestId) {
            return addToQueue({
                payload,
                flowRun,
                platformId,
                synchronousHandlerId: returnHandlerId(pauseMetadata, requestId, log),
                httpRequestId: flowRun.pauseMetadata?.requestIdToReply ?? undefined,
                progressUpdateType,
                executeTrigger: false,
                executionType,
            }, log)
        }
        await flowRunSideEffects(log).onResume(flowRun)
        return flowRun
    },
    async updateRun({
        flowRunId,
        status,
        tasks,
        projectId,
        tags,
        duration,
        failedStepName,
        pauseMetadata,
        logsFileId,
    }: UpdateRunParams): Promise<void> {
        log.info({
            runId: flowRunId,
            status,
            tasks,
            duration,
            failedStepName,
        }, '[FlowRunService#updateRun]')

        await runsMetadataQueue(log).add({
            id: flowRunId,
            status,
            failedStepName,
            logsFileId,
            projectId,
            tags,
            ...spreadIfDefined('tasks', tasks),
            ...spreadIfDefined('duration', duration ? Math.floor(Number(duration)) : undefined),
            ...spreadIfDefined('pauseMetadata', pauseMetadata),
            finishTime: isFlowRunStateTerminal({
                status,
                ignoreInternalError: true,
            }) ? new Date().toISOString() : undefined,
        })
    },

    async start({
        flowId,
        payload,
        executeTrigger,
        executionType,
        synchronousHandlerId,
        progressUpdateType,
        httpRequestId,
        projectId,
        flowVersionId,
        parentRunId,
        failParentOnFailure,
        platformId,
        stepNameToTest,
        environment,
    }: StartParams): Promise<FlowRun> {
        return tracer.startActiveSpan('flowRun.start', {
            attributes: {
                'flowRun.flowVersionId': flowVersionId,
                'flowRun.projectId': projectId,
                'flowRun.environment': environment,
                'flowRun.executionType': executionType,
                'flowRun.progressUpdateType': progressUpdateType,
                'flowRun.executeTrigger': executeTrigger,
                'flowRun.httpRequestId': httpRequestId ?? 'none',
            },
        }, async (span) => {
            try {
                span.setAttribute('flowRun.flowId', flowId)

                const newFlowRun = await queueOrCreateInstantly({
                    projectId,
                    flowVersionId,
                    parentRunId,
                    flowId,
                    failParentOnFailure,
                    stepNameToTest,
                    environment,
                }, log)
                span.setAttribute('flowRun.id', newFlowRun.id)

                await addToQueue({
                    flowRun: newFlowRun,
                    platformId,
                    payload,
                    executeTrigger,
                    executionType,
                    synchronousHandlerId,
                    httpRequestId,
                    progressUpdateType,
                }, log)

                span.setAttribute('flowRun.queued', true)
                await flowRunSideEffects(log).onStart(newFlowRun)
                return newFlowRun
            }
            finally {
                span.end()
            }
        })
    },

    async test({ projectId, flowVersionId, parentRunId, stepNameToTest }: TestParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)

        const triggerPayload = await sampleDataService(log).getOrReturnEmpty({
            projectId,
            flowVersion,
            stepName: flowVersion.trigger.name,
            type: SampleDataFileType.OUTPUT,
        })
        const flowRun = await queueOrCreateInstantly({
            projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.TESTING,
            parentRunId,
            failParentOnFailure: undefined,
            stepNameToTest,
        }, log)
        return addToQueue({
            flowRun,
            payload: triggerPayload,
            executionType: ExecutionType.BEGIN,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            platformId: await projectService.getPlatformId(projectId),
            executeTrigger: false,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            sampleData: !isNil(stepNameToTest) ? await sampleDataService(log).getSampleDataForFlow(projectId, flowVersion, SampleDataFileType.OUTPUT) : undefined,
        }, log)
    },
    async getOne(params: GetOneParams): Promise<FlowRun | null> {
        const flowRun = await queryBuilderForFlowRun(flowRunRepo()).where({
            id: params.id,
            ...(params.projectId ? { projectId: params.projectId } : {}),
        }).getOne()

        return flowRun
    },
    async getOneOrThrow(params: GetOneParams): Promise<FlowRun> {
        const flowRun = await this.getOne(params)

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
            const stateFile = await flowRunLogsService(log).getLogs({
                logsFileId: flowRun.logsFileId,
                projectId: flowRun.projectId,
            })
            if (!isNil(stateFile)) {
                steps = stateFile.executionState.steps
            }
        }
        return {
            ...flowRun,
            steps,
        }
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
        await addToQueue({
            payload,
            flowRun,
            platformId: await projectService.getPlatformId(flowRun.projectId),
            synchronousHandlerId,
            httpRequestId: requestId,
            executeTrigger: false,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            executionType: ExecutionType.RESUME,
        }, log)
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


async function addToQueue(params: AddToQueueParams, log: FastifyBaseLogger): Promise<FlowRun> {
    const logsFileId = params.flowRun.logsFileId ?? apId()
    const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
        logsFileId,
        projectId: params.flowRun.projectId,
        flowRunId: params.flowRun.id,
        behavior: USE_SIGNED_URL ? UploadLogsBehavior.REDIRECT_TO_S3 : UploadLogsBehavior.UPLOAD_DIRECTLY,
    })

    const traceContext: Record<string, string> = {}
    propagation.inject(context.active(), traceContext)

    await jobQueue(log).add({
        id: params.flowRun.id,
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            synchronousHandlerId: params.synchronousHandlerId ?? null,
            projectId: params.flowRun.projectId,
            platformId: params.platformId,
            environment: params.flowRun.environment,
            flowId: params.flowRun.flowId,
            runId: params.flowRun.id,
            jobType: WorkerJobType.EXECUTE_FLOW,
            flowVersionId: params.flowRun.flowVersionId,
            payload: params.payload,
            executeTrigger: params.executeTrigger,
            httpRequestId: params.httpRequestId,
            executionType: params.executionType,
            progressUpdateType: params.progressUpdateType,
            stepNameToTest: params.flowRun.stepNameToTest,
            sampleData: params.sampleData,
            logsUploadUrl,
            logsFileId,
            traceContext,
        },
    })
    return params.flowRun
}

function queryBuilderForFlowRun(repo: Repository<FlowRun>): SelectQueryBuilder<FlowRun> {
    return repo.createQueryBuilder('flow_run')
        .leftJoinAndSelect('flow_run.flowVersion', 'flowVersion')
        .addSelect(['"flowVersion"."displayName"'])
}

async function queueOrCreateInstantly(params: CreateParams, log: FastifyBaseLogger): Promise<FlowRun> {
    const now = new Date().toISOString()
    const flowRun: FlowRun = {
        id: apId(),
        projectId: params.projectId,
        flowId: params.flowId,
        flowVersionId: params.flowVersionId,
        environment: params.environment,
        startTime: now,
        parentRunId: params.parentRunId,
        failParentOnFailure: params.failParentOnFailure ?? true,
        status: FlowRunStatus.QUEUED,
        stepNameToTest: params.stepNameToTest,
        created: now,
        updated: now,
        steps: {},
    }
    switch (params.environment) {
        case RunEnvironment.TESTING:
            return flowRunRepo().save(flowRun)
        case RunEnvironment.PRODUCTION:
            await runsMetadataQueue(log).add(flowRun)
            return flowRun
    }
}


type UpdateRunParams = {
    flowRunId: FlowRunId
    projectId: string
    status: FlowRunStatus
    tasks: number | undefined
    duration: number | undefined
    pauseMetadata?: PauseMetadata
    tags: string[]
    failedStepName?: string | undefined
    logsFileId: string | undefined
}


type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    parentRunId?: FlowRunId
    failParentOnFailure: boolean | undefined
    stepNameToTest?: string
    flowId: FlowId
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
    failedStepName?: string
    flowRunIds?: FlowRunId[]
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

type AddToQueueParams = {
    flowRun: FlowRun
    platformId: PlatformId
    payload: unknown
    executeTrigger: boolean
    executionType: ExecutionType
    synchronousHandlerId: string | undefined
    httpRequestId: string | undefined
    progressUpdateType: ProgressUpdateType
    sampleData?: Record<string, unknown>
}

type StartParams = {
    flowId: FlowId
    payload: unknown
    platformId: PlatformId
    environment: RunEnvironment
    flowVersionId: FlowVersionId
    projectId: ProjectId
    parentRunId?: FlowRunId
    failParentOnFailure: boolean | undefined
    stepNameToTest?: string
    executeTrigger: boolean
    executionType: ExecutionType
    synchronousHandlerId: string | undefined
    httpRequestId: string | undefined
    progressUpdateType: ProgressUpdateType
    sampleData?: Record<string, unknown>
}



type TestParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    parentRunId?: FlowRunId
    stepNameToTest?: string
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
type ResumeWebhookParams = {
    flowRunId: FlowRunId
    requestId?: string
    progressUpdateType: ProgressUpdateType
    payload?: unknown
    executionType: ExecutionType
    checkRequestId: boolean
}
