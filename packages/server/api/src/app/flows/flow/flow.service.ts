import { apDayjs, apDayjsDuration } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    CreateFlowRequest,
    Cursor,
    ErrorCode,
    Flow,
    FlowId,
    FlowOperationRequest,
    FlowOperationStatus,
    FlowOperationType,
    flowPieceUtil,
    FlowStatus,
    FlowTemplateWithoutProjectInformation,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    isNil,
    Metadata,
    PlatformId,
    PopulatedFlow,
    ProjectId,
    SeekPage,
    TelemetryEventName,
    TriggerSource,
    UncategorizedFolderId,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, IsNull, Not } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import Paginator from '../../helper/pagination/paginator'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { telemetry } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { flowVersionMigrationService } from '../flow-version/flow-version-migration.service'
import { flowVersionRepo, flowVersionService } from '../flow-version/flow-version.service'
import { flowFolderService } from '../folder/folder.service'
import { flowExecutionCache } from './flow-execution-cache'
import { FlowEntity } from './flow.entity'
import { flowRepo } from './flow.repo'

export const flowService = (log: FastifyBaseLogger) => ({
    async create({ projectId, request, externalId }: CreateParams): Promise<PopulatedFlow> {
        const folderId = await getFolderIdFromRequest({ projectId, folderId: request.folderId, folderName: request.folderName, log })
        const newFlow: NewFlow = {
            id: apId(),
            projectId,
            folderId,
            status: FlowStatus.DISABLED,
            publishedVersionId: null,
            externalId: externalId ?? apId(),
            metadata: request.metadata,
            operationStatus: FlowOperationStatus.NONE,
        }
        const savedFlow = await flowRepo().save(newFlow)

        const savedFlowVersion = await flowVersionService(log).createEmptyVersion(
            savedFlow.id,
            {
                displayName: request.displayName,
            },
        )

        telemetry(log).trackProject(savedFlow.projectId, {
            name: TelemetryEventName.CREATED_FLOW,
            payload: {
                flowId: savedFlow.id,
            },
        })
            .catch((e) =>
                log.error(e, '[FlowService#create] telemetry.trackProject'),
            )

        return {
            ...savedFlow,
            version: savedFlowVersion,
        }
    },

    async list({
        projectIds,
        platformId,
        cursorRequest,
        limit = Paginator.NO_LIMIT,
        folderId,
        status,
        name,
        connectionExternalIds,
        agentExternalIds,
        externalIds,
        versionState = FlowVersionState.DRAFT,
        includeTriggerSource = true,
    }: ListParams): Promise<SeekPage<PopulatedFlow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: FlowEntity,
            alias: 'ff',
            query: {
                limit,
                order: 'DESC',
                orderBy: 'updated',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = flowRepo().createQueryBuilder('ff').where({ operationStatus: Not(FlowOperationStatus.DELETING) })

        if (projectIds) {
            queryBuilder.andWhere({ projectId: In(projectIds) })
        }
        else {
            queryBuilder
                .innerJoin('project', 'project', 'project.id = ff."projectId"')
                .andWhere('project."platformId" = :platformId', { platformId })
        }

        if (folderId !== undefined) {
            queryBuilder.andWhere({ folderId: folderId === UncategorizedFolderId ? IsNull() : folderId })
        }

        if (status !== undefined) {
            queryBuilder.andWhere({ status: In(status) })
        }

        const latestVersionSubquery = flowVersionRepo()
            .createQueryBuilder('fv_sub')
            .select('fv_sub.id')
            .where('fv_sub."flowId" = ff.id')
            .orderBy('fv_sub.created', 'DESC')
            .limit(1)

        if (versionState === FlowVersionState.DRAFT) {
            queryBuilder.leftJoinAndMapOne(
                'ff.version',
                'flow_version',
                'latest_version',
                `latest_version."flowId" = ff.id AND latest_version.id = (${latestVersionSubquery.getQuery()})`,
            )
        }
        else {
            queryBuilder.leftJoin(
                'flow_version',
                'latest_version',
                `latest_version."flowId" = ff.id AND latest_version.id = (${latestVersionSubquery.getQuery()})`,
            )
            queryBuilder.leftJoinAndMapOne(
                'ff.version',
                'flow_version',
                'published_version',
                'published_version.id = ff.publishedVersionId',
            )
        }

        if (includeTriggerSource) {
            queryBuilder.leftJoinAndMapOne(
                'ff.triggerSource',
                'trigger_source',
                'ts',
                'ts."flowId" = ff.id AND ts.deleted IS NULL',
            )
        }

        if (name !== undefined) {
            queryBuilder.andWhere('LOWER(latest_version."displayName") LIKE LOWER(:name)', { name: `%${name}%` })
        }

        if (externalIds !== undefined) {
            queryBuilder.andWhere('ff."externalId" IN (:...externalIds)', { externalIds })
        }

        if (connectionExternalIds !== undefined) {
            queryBuilder.andWhere('latest_version."connectionIds" && :connectionExternalIds', { connectionExternalIds })
        }

        if (agentExternalIds !== undefined) {
            queryBuilder.andWhere('latest_version."agentIds" && :agentExternalIds', { agentExternalIds })
        }

        const paginationResult = await paginator.paginate<Flow & { version: FlowVersion | null, triggerSource?: TriggerSource }>(queryBuilder)

        const populatedFlows = await Promise.all(paginationResult.data.map(async (flow) => {
            if (isNil(flow.version)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'FlowVersion',
                        message: `flowId=${flow.id}`,
                    },
                })
            }
            const migratedVersion = await flowVersionMigrationService.migrate(flow.version)
            return {
                ...flow,
                version: migratedVersion,
                triggerSource: includeTriggerSource && flow.triggerSource
                    ? {
                        schedule: flow.triggerSource.schedule,
                    }
                    : undefined,
            }
        }))
        return paginationHelper.createPage(populatedFlows, paginationResult.cursor)
    },
    async exists(id: FlowId): Promise<boolean> {
        return flowRepo().existsBy({
            id,
        })
    },
    async getOneById(id: string): Promise<Flow | null> {
        const flow = await flowRepo().findOneBy({
            id,
        })
        if (isNil(flow)) {
            return null
        }
        const projectExists = await projectService.exists({
            projectId: flow.projectId,
        })
        if (!projectExists) {
            return null
        }
        return flow
    },
    async getOne({ id, projectId, entityManager }: GetOneParams): Promise<Flow | null> {
        const projectExists = await projectService.exists({
            projectId,
        })
        if (!projectExists) {
            return null
        }
        return flowRepo(entityManager).findOneBy({
            id,
            projectId,
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<Flow> {
        const flow = await this.getOne(params)
        assertFlowIsNotNull(flow)
        return flow
    },

    async getOnePopulated({
        id,
        projectId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
    }: GetOnePopulatedParams): Promise<PopulatedFlow | null> {
        const flow = await flowRepo(entityManager).findOne({
            where: {
                id,
                projectId,
            },
        })

        const projectExists = await projectService.exists({
            projectId,
        })
        if (isNil(flow) || !projectExists) {
            return null
        }

        const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: id,
            versionId,
            removeConnectionsName,
            removeSampleData,
            entityManager,
        })

        const triggerSource = await triggerSourceService(log).getByFlowId({
            flowId: id,
            projectId,
            simulate: undefined,
        })

        return {
            ...flow,
            version: flowVersion,
            triggerSource: triggerSource ? {
                schedule: triggerSource.schedule,
            } : undefined,
        }
    },

    async getOnePopulatedOrThrow({
        id,
        projectId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
    }: GetOnePopulatedParams): Promise<PopulatedFlow> {
        const flow = await this.getOnePopulated({
            id,
            projectId,
            versionId,
            removeConnectionsName,
            removeSampleData,
            entityManager,
        })

        assertFlowIsNotNull(flow)
        return flow
    },

    async update({
        id,
        userId,
        projectId,
        platformId,
        operation,
    }: UpdateParams): Promise<PopulatedFlow> {

        if (operation.type === FlowOperationType.LOCK_AND_PUBLISH || operation.type === FlowOperationType.CHANGE_STATUS) {
            const flow = await this.getOneOrThrow({
                id,
                projectId,
            })
            if (flow.operationStatus !== FlowOperationStatus.NONE) {
                throw new ActivepiecesError({
                    code: ErrorCode.FLOW_OPERATION_IN_PROGRESS,
                    params: {
                        message: `Flow is busy with ${flow.operationStatus.toLocaleLowerCase()} operation. Please try again in a moment.`,
                    },
                })
            }
        }

        switch (operation.type) {
            case FlowOperationType.LOCK_AND_PUBLISH: {
                await this.updatedPublishedVersionId({
                    id,
                    userId,
                    projectId,
                    platformId,
                })
                await flowRepo().update(id, {
                    operationStatus: operation.request.status === FlowStatus.ENABLED ? FlowOperationStatus.ENABLING : FlowOperationStatus.DISABLING,
                })
                await this.addUpdateStatusJob({
                    id,
                    projectId,
                    newStatus: operation.request.status ?? FlowStatus.ENABLED,
                })
                break
            }

            case FlowOperationType.CHANGE_STATUS: {
                await flowRepo().update(id, {
                    operationStatus: operation.request.status === FlowStatus.ENABLED ? FlowOperationStatus.ENABLING : FlowOperationStatus.DISABLING,
                })
                await this.addUpdateStatusJob({
                    id,
                    projectId,
                    newStatus: operation.request.status,
                })
                break
            }

            case FlowOperationType.CHANGE_FOLDER: {
                await flowRepo().update(id, {
                    folderId: operation.request.folderId,
                })
                break
            }

            case FlowOperationType.UPDATE_METADATA: {
                await this.updateMetadata({
                    id,
                    projectId,
                    metadata: operation.request.metadata,
                })
                break
            }
            default: {
                let lastVersion = await flowVersionService(
                    log,
                ).getFlowVersionOrThrow({
                    flowId: id,
                    versionId: undefined,
                })

                if (lastVersion.state === FlowVersionState.LOCKED) {
                    const lastVersionWithArtifacts = await flowVersionService(
                        log,
                    ).getFlowVersionOrThrow({
                        flowId: id,
                        versionId: undefined,
                    })

                    lastVersion = await flowVersionService(
                        log,
                    ).createEmptyVersion(id, {
                        displayName: lastVersionWithArtifacts.displayName,
                    })

                    // Duplicate the artifacts from the previous version, otherwise they will be deleted during update operation
                    lastVersion = await flowVersionService(log).applyOperation({
                        userId,
                        projectId,
                        platformId,
                        flowVersion: lastVersion,
                        userOperation: {
                            type: FlowOperationType.IMPORT_FLOW,
                            request: lastVersionWithArtifacts,
                        },
                    })
                }
                await flowVersionService(log).applyOperation({
                    userId,
                    projectId,
                    platformId,
                    flowVersion: lastVersion,
                    userOperation: operation,
                })
            }
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
        })
    },
    async updatedPublishedVersionId({
        id,
        userId,
        projectId,
        platformId,
    }: UpdatePublishedVersionIdParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({ id, projectId })

        const flowVersionToPublish = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: id,
            versionId: undefined,
        })

        if (flowToUpdate.status === FlowStatus.ENABLED && !isNil(flowToUpdate.publishedVersionId)) {
            await triggerSourceService(log).disable({
                flowId: flowToUpdate.id,
                projectId: flowToUpdate.projectId,
                simulate: false,
                ignoreError: false,
            })
        }

        return transaction(async (entityManager) => {
            const lockedFlowVersion = await lockFlowVersionIfNotLocked({
                flowVersion: flowVersionToPublish,
                userId,
                projectId,
                platformId,
                entityManager,
                log,
            })

            flowToUpdate.publishedVersionId = lockedFlowVersion.id
            flowToUpdate.status = FlowStatus.DISABLED
            const updatedFlow = await flowRepo(entityManager).save(flowToUpdate)
            await flowExecutionCache(log).invalidate(updatedFlow.id)
            return {
                ...updatedFlow,
                version: lockedFlowVersion,
            }
        })
    },

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const flow = await this.getOneOrThrow({
            id,
            projectId,
        })
        if (flow.operationStatus !== FlowOperationStatus.NONE) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_OPERATION_IN_PROGRESS,
                params: {
                    message: `Flow ${id} is already being ${flow.operationStatus}`,
                },
            })
        }
        await this.addDeleteJob(flow)
        await flowRepo().update(id, {
            operationStatus: FlowOperationStatus.DELETING,
        })
    },

    async getAllEnabled(): Promise<PopulatedFlow[]> {
        const flows = await flowRepo().findBy({
            status: FlowStatus.ENABLED,
        })
        return Promise.all(flows.map(async (flow) => this.getOnePopulatedOrThrow({
            id: flow.id,
            projectId: flow.projectId,
            versionId: flow.publishedVersionId ?? undefined,
        })))
    },
    async deleteAllByPlatformId(platformId: PlatformId): Promise<void> {
        const projectIds = await projectService.getProjectIdsByPlatform(platformId)
        const flows = await flowRepo().findBy({
            projectId: In(projectIds),
        })
        await Promise.all(flows.map((flow) => this.delete({ id: flow.id, projectId: flow.projectId })))
    },

    async getTemplate({
        flowId,
        versionId,
        projectId,
    }: GetTemplateParams): Promise<FlowTemplateWithoutProjectInformation> {
        const flow = await this.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId,
            removeConnectionsName: true,
            removeSampleData: true,
        })

        return {
            name: flow.version.displayName,
            description: '',
            pieces: Array.from(new Set(flowPieceUtil.getUsedPieces(flow.version.trigger))),
            template: flow.version,
            tags: [],
            created: Date.now().toString(),
            updated: Date.now().toString(),
            blogUrl: '',
        }
    },

    async count({ projectId, folderId, status }: CountParams): Promise<number> {
        if (folderId === undefined) {
            return flowRepo().countBy({ projectId, status })
        }

        return flowRepo().countBy({
            folderId: folderId !== UncategorizedFolderId ? folderId : IsNull(),
            projectId,
            status,
        })
    },

    async existsByProjectAndStatus(params: ExistsByProjectAndStatusParams): Promise<boolean> {
        const { projectId, status, entityManager } = params

        return flowRepo(entityManager).existsBy({
            projectId,
            status,
        })
    },

    async updateMetadata({
        id,
        projectId,
        metadata,
    }: UpdateMetadataParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({
            id,
            projectId,
        })

        flowToUpdate.metadata = metadata

        await flowRepo().save(flowToUpdate)

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
        })
    },

    async updateLastModified(flowId: FlowId, projectId: ProjectId): Promise<void> {
        const flow = await this.getOneOrThrow({
            id: flowId,
            projectId,
        })

        flow.updated = dayjs().toISOString()
        await flowRepo().save(flow)
    },

    addDeleteJob: async (flow: Flow): Promise<void> => {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.DELETE_FLOW,
                data: {
                    flow,
                    preDeleteDone: false,
                    dbDeleteDone: false,
                },
                jobId: `delete-flow-${flow.id}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
            customConfig: {
                backoff: {
                    type: 'exponential',
                    delay: apDayjsDuration(5, 'second').asMilliseconds(),
                },
            },
        })
    },
    
    addUpdateStatusJob: async (data: Omit<SystemJobData<SystemJobName.UPDATE_FLOW_STATUS>, 'preUpdateDone'>): Promise<void> => {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.UPDATE_FLOW_STATUS,
                data: {
                    ...data,
                    preUpdateDone: false,
                },
                jobId: `update-flow-status-${data.id}`,
                
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
            customConfig: {
                backoff: {
                    type: 'exponential',
                    delay: apDayjsDuration(5, 'second').asMilliseconds(),
                },
            },
        })
    },
})


const lockFlowVersionIfNotLocked = async ({
    flowVersion,
    userId,
    projectId,
    platformId,
    entityManager,
    log,
}: LockFlowVersionIfNotLockedParams): Promise<FlowVersion> => {
    if (flowVersion.state === FlowVersionState.LOCKED) {
        return flowVersion
    }

    return flowVersionService(log).applyOperation({
        userId,
        projectId,
        platformId,
        flowVersion,
        userOperation: {
            type: FlowOperationType.LOCK_FLOW,
            request: {
                flowId: flowVersion.flowId,
            },
        },
        entityManager,
    })
}


const getFolderIdFromRequest = async ({ projectId, folderId, folderName, log }: { projectId: string, folderId: string | undefined, folderName: string | undefined, log: FastifyBaseLogger }) => {
    if (folderId) {
        return folderId
    }
    if (folderName) {
        return (await flowFolderService(log).upsert({
            projectId,
            request: {
                projectId,
                displayName: folderName,
            },
        })).id
    }
    return null
}

const assertFlowIsNotNull: <T extends Flow>(
    flow: T | null
) => asserts flow is T = <T>(flow: T | null) => {
    if (isNil(flow)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {},
        })
    }
}

type CreateParams = {
    projectId: ProjectId
    request: CreateFlowRequest
    externalId?: string
}

type ListParamsBase = {
    cursorRequest?: Cursor
    limit?: number
    folderId?: string
    status?: FlowStatus[]
    name?: string
    versionState?: FlowVersionState
    externalIds?: string[]
    connectionExternalIds?: string[]
    agentExternalIds?: string[]
    includeTriggerSource?: boolean
}

type ListParams = ListParamsBase & (
    | { projectIds: ProjectId[], platformId?: never }
    | { projectIds?: never, platformId: PlatformId }
)

type GetOneParams = {
    id: FlowId
    projectId: ProjectId
    entityManager?: EntityManager
}

type GetOnePopulatedParams = GetOneParams & {
    versionId?: FlowVersionId
    removeConnectionsName?: boolean
    removeSampleData?: boolean
}

type GetTemplateParams = {
    flowId: FlowId
    projectId: ProjectId
    versionId: FlowVersionId | undefined
}

type CountParams = {
    projectId: ProjectId
    folderId?: string
    status?: FlowStatus
}

type UpdateParams = {
    id: FlowId
    userId: UserId | null
    projectId: ProjectId
    operation: FlowOperationRequest
    platformId: PlatformId
}

type UpdatePublishedVersionIdParams = {
    id: FlowId
    userId: UserId | null
    platformId: PlatformId
    projectId: ProjectId
}

type DeleteParams = {
    id: FlowId
    projectId: ProjectId
}


type NewFlow = Omit<Flow, 'created' | 'updated'>

type LockFlowVersionIfNotLockedParams = {
    flowVersion: FlowVersion
    userId: UserId | null
    projectId: ProjectId
    platformId: PlatformId
    entityManager: EntityManager
    log: FastifyBaseLogger
}

type ExistsByProjectAndStatusParams = {
    projectId: ProjectId
    status: FlowStatus
    entityManager: EntityManager
}

type UpdateMetadataParams = {
    id: FlowId
    projectId: ProjectId
    metadata: Metadata | null | undefined
}
