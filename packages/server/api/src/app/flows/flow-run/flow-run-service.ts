import { apDayjs } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    apId,
    Cursor,
    ErrorCode,
    ExecutionType,
    FlowId,
    FlowRetryStrategy,
    FlowRun,
    FlowRunId,
    FlowRunStatus,
    FlowRunWithRetryError,
    FlowVersionId,
    isFlowRunStateTerminal,
    isNil,
    JobPayload,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PlatformId,
    ProjectId,
    RunEnvironment,
    SampleDataFileType,
    SeekPage,
    StreamStepProgress,
    UploadLogsBehavior,
    WorkerJobType,
} from '@activepieces/shared'
import { context, propagation, trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { ArrayContains, In, IsNull, Not, Repository, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { payloadOffloader } from '../../workers/payload-offloader'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from '../step-run/sample-data.service'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'
import { runsMetadataQueue } from './flow-runs-queue'
import { flowRunLogsService } from './logs/flow-run-logs-service'

const CANCELLABLE_STATUSES: FlowRunStatus[] = [FlowRunStatus.PAUSED, FlowRunStatus.QUEUED]


const tracer = trace.getTracer('flow-run-service')
export const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000
export const flowRunRepo = repoFactory<FlowRun>(FlowRunEntity)
const USE_SIGNED_URL = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS) ?? false

export const flowRunService = (log: FastifyBaseLogger) => ({
    async upsert({ id, projectId }: { id: FlowRunId, projectId: ProjectId }): Promise<FlowRun> {
        const existingFlowRun = await flowRunRepo().findOneBy({ id, projectId })
        if (isNil(existingFlowRun)) {
            return flowRunRepo().save({ id, projectId })
        }
        return existingFlowRun
    },
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


        const whereClause: Record<string, unknown> = {
            projectId: params.projectId,
        }
        if (!isNil(params.environment)) {
            whereClause.environment = params.environment
        }
        let query = queryBuilderForFlowRun(flowRunRepo()).where(whereClause)

        if (!params.includeArchived) {
            query = query.andWhere({
                archivedAt: IsNull(),
            })
        }

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
            query = query.andWhere({ tags: ArrayContains(params.tags) })
        }

        if (!isNil(params.failedStepName)) {
            query = query.andWhere('flow_run."failedStep"->>\'name\' = :failedStepName', {
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
    async retry({ flowRunId, strategy, projectId }: RetryParams): Promise<FlowRun> {
        const oldFlowRun = await flowRunService(log).getOnePopulatedOrThrow({
            id: flowRunId,
            projectId,
        })
        log.info({ runId: flowRunId, flowId: oldFlowRun.flowId, strategy }, 'Flow run retry initiated')
        
        const retentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
        if (
            isFlowRunStateTerminal({ status: oldFlowRun.status, ignoreInternalError: false }) &&
            isOutsideRetentionWindow(oldFlowRun.created, retentionDays)
        ) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_RETRY_OUTSIDE_RETENTION,
                params: {
                    flowRunId: oldFlowRun.id,
                    failedJobRetentionDays: retentionDays,
                },
            })
        }

        switch (strategy) {
            case FlowRetryStrategy.FROM_FAILED_STEP: {
                await flowRunRepo().update({
                    id: oldFlowRun.id,
                    projectId: oldFlowRun.projectId,
                }, {
                    status: FlowRunStatus.QUEUED,
                })
                const updatedFlowRun = await findFlowRunOrThrow(oldFlowRun.id)
                const platformId = await projectService(log).getPlatformId(updatedFlowRun.projectId)
                await flowRunSideEffects(log).onRetry(updatedFlowRun)
                return addToQueue({
                    flowRun: updatedFlowRun,
                    platformId,
                    streamStepProgress: StreamStepProgress.NONE,
                    executeTrigger: false,
                    executionType: ExecutionType.RESUME,
                    workerHandlerId: undefined,
                    httpRequestId: undefined,
                }, log)
            }
            case FlowRetryStrategy.ON_LATEST_VERSION: {
                const latestFlowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(
                    oldFlowRun.flowId,
                )
                const payload = oldFlowRun.steps ? oldFlowRun.steps[latestFlowVersion.trigger.name]?.output : undefined
                return this.start({
                    flowId: oldFlowRun.flowId,
                    payload,
                    platformId: await projectService(log).getPlatformId(oldFlowRun.projectId),
                    executionType: ExecutionType.BEGIN,
                    streamStepProgress: StreamStepProgress.NONE,
                    workerHandlerId: undefined,
                    httpRequestId: undefined,
                    executeTrigger: false,
                    environment: oldFlowRun.environment,
                    flowVersionId: latestFlowVersion.id,
                    projectId: oldFlowRun.projectId,
                    failParentOnFailure: oldFlowRun.failParentOnFailure,
                    parentRunId: oldFlowRun.parentRunId,
                })
            }
        }
    },
    async cancel({ projectId, platformId, flowRunIds, excludeFlowRunIds, status, flowId, createdAfter, createdBefore }: CancelParams): Promise<void> {
        const filteredStatus = status ?? CANCELLABLE_STATUSES
        const flowRuns = await filterFlowRunsAndApplyFilters({
            projectId,
            flowRunIds,
            status: filteredStatus,
            flowId,
            createdAfter,
            createdBefore,
            excludeFlowRunIds,
        })
        const cancelParentFlowRuns = await Promise.allSettled(flowRuns.map(flowRun => cancelSingleRun(log, flowRun, platformId)))
        const childFlows = await getAllChildRuns(flowRuns.map(flowRun => flowRun.id))
        log.info({
            flowRunsCount: flowRuns.length,
            childFlowCount: childFlows.length,
        }, 'Found cancellable descendant flows')

        const canceChildlPromises = await Promise.allSettled(childFlows.map(flowRun => cancelSingleRun(log, flowRun, platformId)))
        if (cancelParentFlowRuns.some(r => r.status === 'rejected')) {
            throw cancelParentFlowRuns.find(r => r.status === 'rejected')!.reason
        }
        if (canceChildlPromises.some(r => r.status === 'rejected')) {
            throw canceChildlPromises.find(r => r.status === 'rejected')!.reason
        }
    },
    async existsBy(runId: FlowRunId): Promise<boolean> {
        return flowRunRepo().existsBy({ id: runId })
    },
    async bulkArchive(params: BulkArchiveActionParams): Promise<void> {
        const filteredFlowRuns = await filterFlowRunsAndApplyFilters(params)
        await flowRunRepo().update({
            id: In(filteredFlowRuns.map(flowRun => flowRun.id)),
            projectId: params.projectId,
        }, {
            archivedAt: new Date().toISOString(),
        })
    },
    async bulkRetry(params: BulkRetryParams): Promise<FlowRunWithRetryError[]> {
        const filteredFlowRuns = await filterFlowRunsAndApplyFilters(params)
        const limit = pLimit(10)
        const results = await Promise.allSettled(
            filteredFlowRuns.map(flowRun =>
                limit(() => this.retry({ flowRunId: flowRun.id, strategy: params.strategy, projectId: params.projectId })),
            ),
        )
        return results.map((result, i) => {
            if (result.status === 'fulfilled') {
                return result.value
            }
            const error = result.reason instanceof ActivepiecesError ? result.reason : undefined
            return {
                ...filteredFlowRuns[i],
                error: {
                    errorCode: error?.error.code ?? ErrorCode.INTERNAL_SERVER_ERROR,
                    errorMessage: error?.message ?? 'Internal server error',
                },
            }
        })
    },
    async start({
        flowId,
        payload,
        executeTrigger,
        executionType,
        workerHandlerId,
        streamStepProgress,
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
                'flowRun.streamStepProgress': streamStepProgress,
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
                    workerHandlerId,
                    httpRequestId,
                    streamStepProgress,
                }, log)

                span.setAttribute('flowRun.queued', true)
                await flowRunSideEffects(log).onStart(newFlowRun)
                log.info({ runId: newFlowRun.id, flowId, projectId, executionType }, 'Flow run started')
                return newFlowRun
            }
            finally {
                span.end()
            }
        })
    },

    async test({ projectId, flowVersionId, parentRunId, stepNameToTest, triggeredBy }: TestParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        await flowService(log).getOneOrThrow({ id: flowVersion.flowId, projectId })

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
            triggeredBy,
        }, log)
        return addToQueue({
            flowRun,
            payload: triggerPayload,
            executionType: ExecutionType.BEGIN,
            workerHandlerId: undefined,
            httpRequestId: undefined,
            platformId: await projectService(log).getPlatformId(projectId),
            executeTrigger: false,
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            sampleData: !isNil(stepNameToTest) ? await sampleDataService(log).getSampleDataForFlow(projectId, flowVersion, SampleDataFileType.OUTPUT) : undefined,
        }, log)
    },
    async startManualTrigger({ projectId, flowVersionId, triggeredBy }: StartManualTriggerParams): Promise<FlowRun> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        await flowService(log).getOneOrThrow({ id: flowVersion.flowId, projectId })
        const triggerPayload = {}
        const flowRun = await queueOrCreateInstantly({
            projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            parentRunId: undefined,
            failParentOnFailure: undefined,
            stepNameToTest: undefined,
            triggeredBy,
        }, log)
        return addToQueue({
            flowRun,
            payload: triggerPayload,
            executionType: ExecutionType.BEGIN,
            workerHandlerId: undefined,
            httpRequestId: undefined,
            platformId: await projectService(log).getPlatformId(projectId),
            executeTrigger: false,
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            sampleData: undefined,
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
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'flow_run',
                    entityId: params.id,
                    message: 'Flow run not found',
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
})


async function cancelSingleRun(log: FastifyBaseLogger, flowRun: FlowRun, platformId: string): Promise<void> {
    await jobQueue(log).removeOneTimeJob({
        jobId: flowRun.id,
        platformId,
    })
    await runsMetadataQueue(log).add({
        id: flowRun.id,
        projectId: flowRun.projectId,
        status: FlowRunStatus.CANCELED,
    })
    log.info({
        runId: flowRun.id,
        flowId: flowRun.flowId,
    }, 'Flow run cancelled')
}

async function getAllChildRuns(parentRunIds: string[]): Promise<FlowRun[]> {
    if (parentRunIds.length === 0) {
        return []
    }

    const query = `
        WITH RECURSIVE descendants AS (
            SELECT *
            FROM flow_run
            WHERE "parentRunId" = ANY($1)
              AND status = ANY($2)

            UNION ALL

            SELECT f.*
            FROM flow_run f
            INNER JOIN descendants d ON f."parentRunId" = d.id
            WHERE f.status = ANY($2)
        )
        SELECT * FROM descendants;
    `

    const params = [
        parentRunIds,
        CANCELLABLE_STATUSES,
    ]

    const results = await flowRunRepo().query(query, params)
    return results as FlowRun[]
}


async function filterFlowRunsAndApplyFilters(
    params: FilterFlowRunsAndApplyFiltersParams,
): Promise<FlowRun[]> {
    let query = flowRunRepo().createQueryBuilder('flow_run').where({
        projectId: params.projectId,
        environment: RunEnvironment.PRODUCTION,
    })

    if (!isNil(params.flowRunIds) && params.flowRunIds.length > 0) {
        query = query.andWhere({
            id: In(params.flowRunIds),
        })
    }

    if (!isNil(params.archived)) {
        query = query.andWhere({
            archivedAt: params.archived ? Not(IsNull()) : IsNull(),
        })
    }

    if (params.flowId && params.flowId.length > 0) {
        query = query.andWhere({
            flowId: In(params.flowId),
        })
    }
    if (params.status && params.status.length > 0) {
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
    if (params.excludeFlowRunIds && params.excludeFlowRunIds.length > 0) {
        query = query.andWhere({
            id: Not(In(params.excludeFlowRunIds)),
        })
    }

    if (params.failedStepName) {
        query = query.andWhere('flow_run.failedStepName = :failedStepName', {
            failedStepName: params.failedStepName,
        })
    }

    const flowRuns = await query.getMany()
    return flowRuns
}


export async function addToQueue(params: AddToQueueParams, log: FastifyBaseLogger): Promise<FlowRun> {
    const logsFileId = params.flowRun.logsFileId ?? apId()
    const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
        logsFileId,
        projectId: params.flowRun.projectId,
        flowRunId: params.flowRun.id,
        behavior: USE_SIGNED_URL ? UploadLogsBehavior.REDIRECT_TO_S3 : UploadLogsBehavior.UPLOAD_DIRECTLY,
    })

    const traceContext: Record<string, string> = {}
    propagation.inject(context.active(), traceContext)

    let jobPayload: JobPayload = { type: 'inline', value: null }
    if (!isNil(params.payload) && isNil(params.workerHandlerId)) {
        jobPayload = await payloadOffloader.offloadPayload(log, params.payload, params.flowRun.projectId, params.platformId)
    }
    else if (!isNil(params.payload)) {
        jobPayload = await payloadOffloader.maybeOffloadPayload(log, params.payload, params.flowRun.projectId, params.platformId)
    }

    await jobQueue(log).add({
        id: params.flowRun.id,
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            workerHandlerId: params.workerHandlerId ?? null,
            projectId: params.flowRun.projectId,
            platformId: params.platformId,
            environment: params.flowRun.environment,
            flowId: params.flowRun.flowId,
            runId: params.flowRun.id,
            jobType: WorkerJobType.EXECUTE_FLOW,
            flowVersionId: params.flowRun.flowVersionId,
            payload: jobPayload,
            executeTrigger: params.executeTrigger,
            httpRequestId: params.httpRequestId,
            executionType: params.executionType,
            streamStepProgress: params.streamStepProgress,
            stepNameToTest: params.flowRun.stepNameToTest ?? undefined,
            sampleData: params.sampleData,
            logsUploadUrl,
            logsFileId,
            traceContext,
        },
    })
    return params.flowRun
}

export async function findFlowRunOrThrow(flowRunId: FlowRunId): Promise<FlowRun> {
    const flowRun = await queryBuilderForFlowRun(flowRunRepo()).where({ id: flowRunId }).getOne()
    if (isNil(flowRun)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'flow_run',
                entityId: flowRunId,
                message: 'Flow run not found',
            },
        })
    }
    return flowRun
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
        parentRunId: params.parentRunId,
        failParentOnFailure: params.failParentOnFailure ?? true,
        status: FlowRunStatus.QUEUED,
        stepNameToTest: params.stepNameToTest,
        created: now,
        updated: now,
        tags: [],
        steps: {},
        triggeredBy: params.triggeredBy,
    }
    switch (params.environment) {
        case RunEnvironment.TESTING:
            return flowRunRepo().save(flowRun)
        case RunEnvironment.PRODUCTION:
            await runsMetadataQueue(log).add(flowRun)
            return flowRun
    }
}

function isOutsideRetentionWindow(createdTime: string, retentionDays: number): boolean {
    if (!createdTime) return false
    return apDayjs(createdTime).add(retentionDays, 'day').isBefore(apDayjs())
}

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    triggeredBy?: string
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
    includeArchived?: boolean
    environment?: RunEnvironment
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

export type AddToQueueParams = {
    flowRun: FlowRun
    platformId: PlatformId
    payload?: unknown
    executeTrigger: boolean
    executionType: ExecutionType
    workerHandlerId: string | undefined
    httpRequestId: string | undefined
    streamStepProgress: StreamStepProgress
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
    workerHandlerId: string | undefined
    httpRequestId: string | undefined
    streamStepProgress: StreamStepProgress
    sampleData?: Record<string, unknown>
}



type TestParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    triggeredBy?: string
    parentRunId?: FlowRunId
    stepNameToTest?: string
}

type StartManualTriggerParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    triggeredBy: string
}
type RetryParams = {
    flowRunId: FlowRunId
    strategy: FlowRetryStrategy
    projectId: ProjectId
}

type CancelParams = {
    projectId: ProjectId
    platformId: PlatformId
    flowRunIds?: FlowRunId[]
    excludeFlowRunIds?: FlowRunId[]
    status?: FlowRunStatus[]
    flowId?: FlowId[]
    createdAfter?: string
    createdBefore?: string
}

type BulkRetryParams = {
    projectId: ProjectId
    flowRunIds?: FlowRunId[]
    strategy: FlowRetryStrategy
    status?: FlowRunStatus[]
    flowId?: FlowId[]
    createdAfter?: string
    archived?: boolean
    createdBefore?: string
    excludeFlowRunIds?: FlowRunId[]
    failedStepName?: string
}

type BulkArchiveActionParams = {
    projectId: ProjectId
    flowRunIds?: FlowRunId[]
    status?: FlowRunStatus[]
    flowId?: FlowId[]
    createdAfter?: string
    archived?: boolean
    createdBefore?: string
    excludeFlowRunIds?: FlowRunId[]
    failedStepName?: string
}

type FilterFlowRunsAndApplyFiltersParams = {
    projectId: ProjectId
    flowRunIds?: FlowRunId[]
    status?: FlowRunStatus[]
    archived?: boolean
    flowId?: FlowId[]
    createdAfter?: string
    createdBefore?: string
    excludeFlowRunIds?: FlowRunId[]
    failedStepName?: string
}
