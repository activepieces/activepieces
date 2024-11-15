import { AppSystemProp, logger, rejectedPromiseHandler, system } from '@activepieces/server-shared'
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
    PlatformId,
    PopulatedFlow,
    ProjectId,
    SeekPage, TelemetryEventName, UserId,
} from '@activepieces/shared'
import { EntityManager, In, IsNull } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { emailService } from '../../ee/helper/email/email-service'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowFolderService } from '../folder/folder.service'
import { flowSideEffects } from './flow-service-side-effects'
import { FlowEntity } from './flow.entity'
import { flowRepo } from './flow.repo'


const TRIGGER_FAILURES_THRESHOLD = system.getNumberOrThrow(AppSystemProp.TRIGGER_FAILURES_THRESHOLD)


export const flowService = {
    async create({ projectId, request }: CreateParams): Promise<PopulatedFlow> {

        const folderId = isNil(request.folderName) ? null : (await flowFolderService.upsert({
            projectId,
            request: {
                projectId,
                displayName: request.folderName,
            },
        })).id
        const newFlow: NewFlow = {
            id: apId(),
            projectId,
            folderId,
            status: FlowStatus.DISABLED,
            publishedVersionId: null,
            schedule: null,
        }

        const savedFlow = await flowRepo().save(newFlow)

        const savedFlowVersion = await flowVersionService.createEmptyVersion(
            savedFlow.id,
            {
                displayName: request.displayName,
            },
        )

        telemetry
            .trackProject(savedFlow.projectId, {
                name: TelemetryEventName.CREATED_FLOW,
                payload: {
                    flowId: savedFlow.id,
                },
            })
            .catch((e) =>
                logger.error(e, '[FlowService#create] telemetry.trackProject'),
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
    }: ListParams): Promise<SeekPage<PopulatedFlow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: FlowEntity,
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
        const paginationResult = await paginator.paginate(
            flowRepo().createQueryBuilder('flow').where(queryWhere),
        )

        const populatedFlowPromises = paginationResult.data.map(async (flow) => {
            const version = await flowVersionService.getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: undefined,
            })

            return {
                ...flow,
                version,
            }
        })

        const populatedFlows = await Promise.all(populatedFlowPromises)
        const filteredPopulatedFlows = name ? populatedFlows.filter((flow) => flow.version.displayName.match(new RegExp(`^.*${name}.*`, 'i'))) : populatedFlows
        return paginationHelper.createPage(filteredPopulatedFlows, paginationResult.cursor)
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

        const flowVersion = await flowVersionService.getFlowVersionOrThrow({
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
            })
            : null

        try {
            if (operation.type === FlowOperationType.LOCK_AND_PUBLISH) {
                await this.updatedPublishedVersionId({
                    id,
                    userId,
                    projectId,
                    platformId,
                })
            }
            else if (operation.type === FlowOperationType.CHANGE_STATUS) {
                await this.updateStatus({
                    id,
                    projectId,
                    newStatus: operation.request.status,
                })
            }
            else if (operation.type === FlowOperationType.CHANGE_FOLDER) {
                await flowRepo().update(id, {
                    folderId: operation.request.folderId,
                })
            }
            else {
                let lastVersion = await flowVersionService.getFlowVersionOrThrow({
                    flowId: id,
                    versionId: undefined,
                })

                if (lastVersion.state === FlowVersionState.LOCKED) {
                    const lastVersionWithArtifacts =
                        await flowVersionService.getFlowVersionOrThrow({
                            flowId: id,
                            versionId: undefined,
                        })

                    lastVersion = await flowVersionService.createEmptyVersion(id, {
                        displayName: lastVersionWithArtifacts.displayName,
                    })

                    // Duplicate the artifacts from the previous version, otherwise they will be deleted during update operation
                    lastVersion = await flowVersionService.applyOperation({
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

                await flowVersionService.applyOperation({
                    userId,
                    projectId,
                    platformId,
                    flowVersion: lastVersion,
                    userOperation: operation,
                })
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
            const { scheduleOptions } = await flowSideEffects.preUpdateStatus({
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
        const flow = await flowService.getOnePopulatedOrThrow({
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

            await emailService.sendExceedFailureThresholdAlert(projectId, flow.version.displayName)
            rejectedPromiseHandler(telemetry.trackProject(projectId, {
                name: TelemetryEventName.TRIGGER_FAILURES_EXCEEDED,
                payload: {
                    projectId,
                    flowId,
                    pieceName: flow.version.trigger.settings.pieceName,
                    pieceVersion: flow.version.trigger.settings.pieceVersion,
                },
            },
            ),
            )
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

        const flowVersionToPublish = await flowVersionService.getFlowVersionOrThrow(
            {
                flowId: id,
                versionId: undefined,
            },
        )

        const { scheduleOptions } = await flowSideEffects.preUpdatePublishedVersionId({
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
        })

        try {
            const flowToDelete = await this.getOneOrThrow({
                id,
                projectId,
            })

            rejectedPromiseHandler(flowSideEffects.preDelete({
                flowToDelete,
            }))

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

    async count({ projectId, folderId }: CountParams): Promise<number> {
        if (folderId === undefined) {
            return flowRepo().countBy({ projectId })
        }

        return flowRepo().countBy({
            folderId: folderId !== 'NULL' ? folderId : IsNull(),
            projectId,
        })
    },

    async existsByProjectAndStatus(params: ExistsByProjectAndStatusParams): Promise<boolean> {
        const { projectId, status, entityManager } = params

        return flowRepo(entityManager).existsBy({
            projectId,
            status,
        })
    },
}

const lockFlowVersionIfNotLocked = async ({
    flowVersion,
    userId,
    projectId,
    platformId,
    entityManager,
}: LockFlowVersionIfNotLockedParams): Promise<FlowVersion> => {
    if (flowVersion.state === FlowVersionState.LOCKED) {
        return flowVersion
    }

    return flowVersionService.applyOperation({
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
}

type ListParams = {
    projectId: ProjectId
    cursorRequest: Cursor | null
    limit: number
    folderId: string | undefined
    status: FlowStatus[] | undefined
    name: string | undefined
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
}

type ExistsByProjectAndStatusParams = {
    projectId: ProjectId
    status: FlowStatus
    entityManager: EntityManager
}
