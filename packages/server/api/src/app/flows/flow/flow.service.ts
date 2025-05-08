import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    CreateFlowRequest,
    Cursor,
    ErrorCode,
    Flow,
    FlowId,
    FlowOperationRequest,
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
    SeekPage, TelemetryEventName, UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, IsNull } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { AddAPArrayContainsToQueryBuilder } from '../../database/database-connection'
import { emailService } from '../../ee/helper/email/email-service'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowFolderService } from '../folder/folder.service'
import { flowSideEffects } from './flow-service-side-effects'
import { FlowEntity } from './flow.entity'
import { flowRepo } from './flow.repo'


const TRIGGER_FAILURES_THRESHOLD = system.getNumberOrThrow(AppSystemProp.TRIGGER_FAILURES_THRESHOLD)

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

export const flowService = (log: FastifyBaseLogger) => ({
    async create({ projectId, request, externalId }: CreateParams): Promise<PopulatedFlow> {
        const folderId = await getFolderIdFromRequest({ projectId, folderId: request.folderId, folderName: request.folderName, log })
        const newFlow: NewFlow = {
            id: apId(),
            projectId,
            folderId,
            status: FlowStatus.DISABLED,
            publishedVersionId: null,
            schedule: null,
            externalId: externalId ?? apId(),
            metadata: request.metadata,
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
        projectId,
        cursorRequest,
        limit,
        folderId,
        status,
        name,
        connectionExternalIds,
        versionState = FlowVersionState.DRAFT,
    }: ListParams): Promise<SeekPage<PopulatedFlow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: FlowEntity,
            alias: 'ff',
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryWhere: Record<string, unknown> = { projectId }
        
        if (folderId !== undefined) {
            queryWhere.folderId = folderId === 'NULL' ? IsNull() : folderId
        }

        if (status !== undefined) {
            queryWhere.status = In(status)
        }

        const queryBuilder = flowRepo().createQueryBuilder('ff')
            .leftJoin(
                'flow_version',
                'latest_version',
                'latest_version."flowId" = ff.id AND latest_version.id = (SELECT id FROM flow_version WHERE "flowId" = ff.id ORDER BY created DESC LIMIT 1)',
            )
            .where(queryWhere)

        if (name !== undefined) {
            queryBuilder.andWhere('latest_version."displayName" LIKE :name', { name: `%${name}%` })
        }

        if (connectionExternalIds !== undefined) {
            AddAPArrayContainsToQueryBuilder(queryBuilder, 'latest_version."connectionIds"', connectionExternalIds)
        }

        const paginationResult = await paginator.paginate(queryBuilder)

        const populatedFlowPromises = paginationResult.data.map(async (flow) => {
            const version = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: (versionState === FlowVersionState.DRAFT) ? undefined : (flow.publishedVersionId ?? undefined),
            })
            return {
                ...flow,
                version,
            }
        })

        const populatedFlows = (await Promise.all(populatedFlowPromises)).filter((flow) => flow !== null)
        return paginationHelper.createPage(populatedFlows, paginationResult.cursor)
    },

    async getOneById(id: string): Promise<Flow | null> {
        return flowRepo().findOneBy({
            id,
        })
    },
    async getOne({ id, projectId, entityManager }: GetOneParams): Promise<Flow | null> {
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
        const flow = await flowRepo(entityManager).findOneBy({
            id,
            projectId,
        })

        if (isNil(flow)) {
            return null
        }

        const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: id,
            versionId,
            removeConnectionsName,
            removeSampleData,
            entityManager,
        })

        return {
            ...flow,
            version: flowVersion,
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
        lock = true,
    }: UpdateParams): Promise<PopulatedFlow> {
        const flowLock = lock
            ? await distributedLock.acquireLock({
                key: id,
                timeout: 30000,
                log,
            })
            : null

        try {
            switch (operation.type) {
                case FlowOperationType.LOCK_AND_PUBLISH:
                {
                    await this.updatedPublishedVersionId({
                        id,
                        userId,
                        projectId,
                        platformId,
                    })
                    break
                }

                case FlowOperationType.CHANGE_STATUS:
                {
                    await this.updateStatus({
                        id,
                        projectId,
                        newStatus: operation.request.status,
                    })
                    break
                }

                case FlowOperationType.CHANGE_FOLDER:
                {
                    await flowRepo().update(id, {
                        folderId: operation.request.folderId,
                    })
                    break
                }

                case FlowOperationType.UPDATE_METADATA:
                {
                    await this.updateMetadata({
                        id,
                        projectId,
                        metadata: operation.request.metadata,
                    })
                    break
                }
                default: {
                    let lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
                        flowId: id,
                        versionId: undefined,
                    })

                    if (lastVersion.state === FlowVersionState.LOCKED) {
                        const lastVersionWithArtifacts =
                            await flowVersionService(log).getFlowVersionOrThrow({
                                flowId: id,
                                versionId: undefined,
                            })

                        lastVersion = await flowVersionService(log).createEmptyVersion(id, {
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
        }
        finally {
            await flowLock?.release()
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
        })
    },

    async updateStatus({
        id,
        projectId,
        newStatus,
        entityManager,
    }: UpdateStatusParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({
            id,
            projectId,
            entityManager,
        })

        if (flowToUpdate.status !== newStatus) {
            const { scheduleOptions } = await flowSideEffects(log).preUpdateStatus({
                flowToUpdate,
                newStatus,
                entityManager,
            })

            flowToUpdate.status = newStatus
            flowToUpdate.schedule = scheduleOptions

            await flowRepo(entityManager).save(flowToUpdate)
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
            entityManager,
        })
    },

    async updateFailureCount({
        flowId,
        projectId,
        success,
    }: UpdateFailureCountParams): Promise<void> {
        const flow = await this.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
        })

        const { schedule } = flow
        const skipUpdateFlowCount = isNil(schedule) || flow.status === FlowStatus.DISABLED

        if (skipUpdateFlowCount) {
            return
        }
        const newFailureCount = success ? 0 : (schedule.failureCount ?? 0) + 1

        if (newFailureCount >= TRIGGER_FAILURES_THRESHOLD) {
            await this.updateStatus({
                id: flowId,
                projectId,
                newStatus: FlowStatus.DISABLED,
            })

            await emailService(log).sendExceedFailureThresholdAlert(projectId, flow.version.displayName)
            rejectedPromiseHandler(telemetry(log).trackProject(projectId, {
                name: TelemetryEventName.TRIGGER_FAILURES_EXCEEDED,
                payload: {
                    projectId,
                    flowId,
                    pieceName: flow.version.trigger.settings.pieceName,
                    pieceVersion: flow.version.trigger.settings.pieceVersion,
                },
            }), log)
        }

        await flowRepo().update(flowId, {
            schedule: {
                ...flow.schedule,
                failureCount: newFailureCount,
            },
        })
    },


    async updatedPublishedVersionId({
        id,
        userId,
        projectId,
        platformId,
    }: UpdatePublishedVersionIdParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({ id, projectId })

        const flowVersionToPublish = await flowVersionService(log).getFlowVersionOrThrow(
            {
                flowId: id,
                versionId: undefined,
            },
        )

        const { scheduleOptions } = await flowSideEffects(log).preUpdatePublishedVersionId({
            flowToUpdate,
            flowVersionToPublish,
        })

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
            flowToUpdate.status = FlowStatus.ENABLED
            flowToUpdate.schedule = scheduleOptions

            const updatedFlow = await flowRepo(entityManager).save(flowToUpdate)

            return {
                ...updatedFlow,
                version: lockedFlowVersion,
            }
        })
    },

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const lock = await distributedLock.acquireLock({
            key: id,
            timeout: 10000,
            log,
        })

        try {
            const flowToDelete = await this.getOneOrThrow({
                id,
                projectId,
            })

            rejectedPromiseHandler(flowSideEffects(log).preDelete({
                flowToDelete,
            }), log)

            await flowRepo().delete({ id })
        }
        finally {
            await lock.release()
        }
    },

    async getAllEnabled(): Promise<Flow[]> {
        return flowRepo().findBy({
            status: FlowStatus.ENABLED,
        })
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
            folderId: folderId !== 'NULL' ? folderId : IsNull(),
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

type ListParams = {
    projectId: ProjectId
    cursorRequest: Cursor | null
    limit: number
    folderId: string | undefined
    status: FlowStatus[] | undefined
    name: string | undefined
    versionState?: FlowVersionState
    connectionExternalIds?: string[]
}

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
    lock?: boolean
    platformId: PlatformId
}

type UpdateStatusParams = {
    id: FlowId
    projectId: ProjectId
    newStatus: FlowStatus
    entityManager?: EntityManager
}

type UpdateFailureCountParams = {
    flowId: FlowId
    projectId: ProjectId
    success: boolean
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
