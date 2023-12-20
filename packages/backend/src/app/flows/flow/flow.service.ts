import { FlowEntity } from './flow.entity'
import {
    apId,
    CreateFlowRequest,
    Cursor,
    Flow,
    flowHelper,
    FlowId,
    FlowStatus,
    FlowOperationRequest,
    FlowOperationType,
    FlowTemplate,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    ProjectId,
    SeekPage,
    TelemetryEventName,
    UserId,
    PopulatedFlow,
} from '@activepieces/shared'
import { flowVersionService } from '../flow-version/flow-version.service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { acquireLock } from '../../helper/lock'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowRepo } from './flow.repo'
import { telemetry } from '../../helper/telemetry.utils'
import { IsNull } from 'typeorm'
import { isNil } from '@activepieces/shared'
import { logger } from '../../helper/logger'
import { flowServiceHooks as hooks } from './flow-service-hooks'

export const flowService = {
    async create({ projectId, request }: CreateParams): Promise<PopulatedFlow> {
        const newFlow: NewFlow = {
            id: apId(),
            projectId,
            folderId: request.folderId ?? null,
            status: FlowStatus.DISABLED,
            publishedVersionId: null,
            schedule: null,
        }

        const savedFlow = await flowRepo.save(newFlow)

        const savedFlowVersion = await flowVersionService.createEmptyVersion(savedFlow.id, {
            displayName: request.displayName,
        })

        telemetry.trackProject(
            savedFlow.projectId,
            {
                name: TelemetryEventName.FLOW_CREATED,
                payload: {
                    flowId: savedFlow.id,
                },
            },
        )
            .catch((e) => logger.error(e, '[FlowService#create] telemetry.trackProject'))

        return {
            ...savedFlow,
            version: savedFlowVersion,
        }
    },

    async list({ projectId, cursorRequest, limit, folderId }: ListParams): Promise<SeekPage<PopulatedFlow>> {
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
            queryWhere.folderId = (folderId === 'NULL' ? IsNull() : folderId)
        }

        const paginationResult = await paginator.paginate(flowRepo.createQueryBuilder('flow').where(queryWhere))
        const flowVersionsPromises: Promise<FlowVersion | null>[] = []
        paginationResult.data.forEach((flow) => {
            flowVersionsPromises.push(flowVersionService.getFlowVersion({
                flowId: flow.id,
                versionId: undefined,
            }))
        })
        const versions: (FlowVersion | null)[] = await Promise.all(flowVersionsPromises)
        const populatedFlows: PopulatedFlow[] = paginationResult.data.map((flow, idx) => ({
            ...flow,
            version: versions[idx]!,
        }))
        return paginationHelper.createPage(populatedFlows, paginationResult.cursor)
    },

    async getOne({ id, projectId }: GetOneParams): Promise<Flow | null> {
        return flowRepo.findOneBy({
            id,
            projectId,
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<Flow> {
        const flow = await this.getOne(params)
        assertFlowIsNotNull(flow)
        return flow
    },

    async getOnePopulated({ id, projectId, versionId, removeSecrets = false }: GetOnePopulatedParams): Promise<PopulatedFlow | null> {
        const flow = await flowRepo.findOneBy({
            id,
            projectId,
        })

        if (isNil(flow)) {
            return null
        }

        const flowVersion = await flowVersionService.getFlowVersion({
            flowId: id,
            versionId,
            removeSecrets,
        })

        return {
            ...flow,
            version: flowVersion,
        }
    },

    async getOnePopulatedOrThrow({ id, projectId, versionId, removeSecrets = false }: GetOnePopulatedParams): Promise<PopulatedFlow> {
        const flow = await this.getOnePopulated({ id, projectId, versionId, removeSecrets })
        assertFlowIsNotNull(flow)
        return flow
    },

    async update({ id, userId, projectId, operation, lock = true }: UpdateParams): Promise<PopulatedFlow> {
        const flowLock = lock ? await acquireLock({
            key: id,
            timeout: 10000,
        }) : null

        try {
            if (operation.type === FlowOperationType.CHANGE_FOLDER) {
                await flowRepo.update(id, {
                    folderId: operation.request.folderId,
                })
            }
            else {
                let lastVersion = await flowVersionService.getFlowVersion({
                    flowId: id,
                    versionId: undefined,
                })

                if (lastVersion.state === FlowVersionState.LOCKED) {
                    const lastVersionWithArtifacts = await flowVersionService.getFlowVersion({
                        flowId: id,
                        versionId: undefined,
                    })

                    lastVersion = await flowVersionService.createEmptyVersion(id, {
                        displayName: lastVersionWithArtifacts.displayName,
                    })

                    // Duplicate the artifacts from the previous version, otherwise they will be deleted during update operation
                    lastVersion = await flowVersionService.applyOperation(userId, projectId, lastVersion, {
                        type: FlowOperationType.IMPORT_FLOW,
                        request: lastVersionWithArtifacts,
                    })
                }

                await flowVersionService.applyOperation(userId, projectId, lastVersion, operation)
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

    async updateStatus({ id, projectId, newStatus }: UpdateStatusParams): Promise<PopulatedFlow> {
        const lock = await acquireLock({
            key: id,
            timeout: 10000,
        })

        try {
            const flowToUpdate = await this.getOneOrThrow({ id, projectId })

            if (flowToUpdate.status !== newStatus) {
                const { scheduleOptions } = await hooks.preUpdateStatus({
                    flowToUpdate,
                    newStatus,
                })

                flowToUpdate.status = newStatus
                flowToUpdate.schedule = scheduleOptions

                await flowRepo.save(flowToUpdate)
            }
        }
        finally {
            await lock.release()
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
        })
    },

    async updatedPublishedVersionId({ id, userId, projectId }: UpdatePublishedVersionIdParams): Promise<PopulatedFlow> {
        const lock = await acquireLock({
            key: id,
            timeout: 10000,
        })

        try {
            const flowToUpdate = await this.getOneOrThrow({ id, projectId })

            const lockedFlow = await this.update({
                id,
                userId,
                projectId,
                operation: {
                    type: FlowOperationType.LOCK_FLOW,
                    request: {
                        flowId: id,
                    },
                },
                lock: false,
            })

            const { scheduleOptions } = await hooks.preUpdatePublishedVersionId({
                flowToUpdate,
                newPublishedVersionId: lockedFlow.version.id,
            })

            flowToUpdate.publishedVersionId = lockedFlow.version.id
            flowToUpdate.status = FlowStatus.ENABLED
            flowToUpdate.schedule = scheduleOptions

            const updatedFlow = await flowRepo.save(flowToUpdate)

            return {
                ...updatedFlow,
                version: lockedFlow.version,
            }
        }
        finally {
            await lock.release()
        }
    },

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const lock = await acquireLock({
            key: id,
            timeout: 10000,
        })

        try {
            const flowToDelete = await this.getOneOrThrow({
                id,
                projectId,
            })

            await hooks.preDelete({
                flowToDelete,
            })

            await flowRepo.delete({ id })
        }
        finally {
            await lock.release()
        }
    },

    async getAllEnabled(): Promise<Flow[]> {
        return flowRepo.findBy({
            status: FlowStatus.ENABLED,
        })
    },

    async getTemplate({ flowId, versionId, projectId }: GetTemplateParams): Promise<FlowTemplate> {
        const flow = await this.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId,
            removeSecrets: true,
        })

        return {
            id: apId(),
            name: flow.version.displayName,
            description: '',
            pieces: flowHelper.getUsedPieces(flow.version.trigger),
            template: flow.version,
            tags: [],
            imageUrl: null,
            userId: null,
            created: Date.now().toString(),
            updated: Date.now().toString(),
            blogUrl: '',
            featuredDescription: '',
            isFeatured: false,
        }
    },

    async count({ projectId, folderId }: CountParams): Promise<number> {
        if (folderId === undefined) {
            return flowRepo.countBy({ projectId })
        }

        return flowRepo.countBy({
            folderId: folderId !== 'NULL' ? folderId : IsNull(),
            projectId,
        })
    },
}

const assertFlowIsNotNull: <T extends Flow>(flow: T | null) => asserts flow is T  = <T>(flow: T | null) => {
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
}

type GetOneParams = {
    id: FlowId
    projectId: ProjectId
}

type GetOnePopulatedParams = GetOneParams & {
    versionId?: FlowVersionId
    removeSecrets?: boolean
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
    userId: UserId
    projectId: ProjectId
    operation: FlowOperationRequest
    lock?: boolean
}

type UpdateStatusParams = {
    id: FlowId
    projectId: ProjectId
    newStatus: FlowStatus
}

type UpdatePublishedVersionIdParams = {
    id: FlowId
    userId: UserId
    projectId: ProjectId
}

type DeleteParams = {
    id: FlowId
    projectId: ProjectId
}

type NewFlow = Omit<Flow, 'created' | 'updated'>
