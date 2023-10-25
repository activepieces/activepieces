import { FlowEntity } from './flow.entity'
import {
    apId,
    CreateFlowRequest,
    Cursor,
    Flow,
    flowHelper,
    FlowId,
    FlowInstance,
    FlowInstanceStatus,
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
} from '@activepieces/shared'
import { flowVersionService } from '../flow-version/flow-version.service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { acquireLock } from '../../helper/lock'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowRepo } from './flow.repo'
import { telemetry } from '../../helper/telemetry.utils'
import { flowInstanceService } from '../flow-instance/flow-instance.service'
import { IsNull } from 'typeorm'
import { isNil } from '@activepieces/shared'
import { logger } from '../../helper/logger'

export const flowService = {
    async create({ projectId, request }: { projectId: ProjectId, request: CreateFlowRequest }): Promise<Flow> {
        const newFlowId = apId()
        const flow: Partial<Flow> = {
            id: newFlowId,
            projectId,
            folderId: request.folderId,
        }
        const savedFlow = await flowRepo.save(flow)
        await flowVersionService.createEmptyVersion(savedFlow.id, {
            displayName: request.displayName,
        })
        const latestFlowVersion = await flowVersionService.getFlowVersion({
            flowId: savedFlow.id,
            versionId: undefined,
            removeSecrets: false,
        })

        telemetry.trackProject(
            savedFlow.projectId,
            {
                name: TelemetryEventName.FLOW_CREATED,
                payload: {
                    flowId: flow.id!,
                },
            },
        )
            .catch((e) => logger.error(e, '[FlowService#create] telemetry.trackProject'))

        return {
            ...savedFlow,
            version: latestFlowVersion!,
        }
    },
    async getOneOrThrow({ projectId, id }: { projectId: ProjectId, id: FlowId }): Promise<Flow> {
        const flow = await flowService.getOne({ projectId, id, versionId: undefined })

        if (flow === null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id,
                },
            })
        }

        return flow
    },
    async list({ projectId, cursorRequest, limit, folderId }: { projectId: ProjectId, cursorRequest: Cursor | null, limit: number, folderId: string | undefined }): Promise<SeekPage<Flow>> {
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
        const flowInstancesPromises: Promise<FlowInstance | null>[] = []
        paginationResult.data.forEach((flow) => {
            flowVersionsPromises.push(flowVersionService.getFlowVersion({
                flowId: flow.id,
                versionId: undefined,
                removeSecrets: false,
            }))
            flowInstancesPromises.push(flowInstanceService.get({ projectId, flowId: flow.id }))
        })
        const versions: (FlowVersion | null)[] = await Promise.all(flowVersionsPromises)
        const instances: (FlowInstance | null)[] = await Promise.all(flowInstancesPromises)
        const formattedFlows = paginationResult.data.map((flow, idx) => {
            let status = FlowInstanceStatus.UNPUBLISHED
            const instance = instances[idx]
            if (instance) {
                status = instance.status
            }
            const formattedFlow: Flow = {
                ...flow,
                version: versions[idx]!,
                status,
                schedule: instance?.schedule,
            }
            return formattedFlow
        })
        return paginationHelper.createPage<Flow>(formattedFlows, paginationResult.cursor)
    },
    async getTemplate({ flowId, versionId, projectId }: { flowId: FlowId, projectId: ProjectId, versionId: FlowVersionId | undefined }): Promise<FlowTemplate> {
        const flow: Flow | null = await flowRepo.findOneBy({
            projectId,
            id: flowId,
        })
        if (isNil(flow)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id: flowId,
                },
            })
        }
        const flowVersion = await flowVersionService.getFlowVersion({
            flowId,
            versionId,
            removeSecrets: true,
        })
        const template: FlowTemplate =
        {
            id: apId(),
            name: flowVersion.displayName,
            description: '',
            pieces: flowHelper.getUsedPieces(flowVersion.trigger),
            template: flowVersion,
            tags: [],
            imageUrl: null,
            userId: null,
            created: Date.now().toString(),
            updated: Date.now().toString(),
            blogUrl: '',
            featuredDescription: '',
            isFeatured: false,
        }
        return template
    },
    async getOne({ projectId, id, versionId }: { projectId: ProjectId, id: FlowId, versionId: FlowVersionId | undefined }): Promise<Flow | null> {
        const flow: Flow | null = await flowRepo.findOneBy({
            projectId,
            id,
        })
        if (isNil(flow)) {
            return null
        }
        const flowVersion = (await flowVersionService.getFlowVersion({
            flowId: id,
            versionId,
            removeSecrets: false,
        }))
        const instance = await flowInstanceService.get({ projectId, flowId: flow.id })
        return {
            ...flow,
            version: flowVersion,
            status: instance ? instance.status : FlowInstanceStatus.UNPUBLISHED,
        }
    },

    async update({ userId, flowId, projectId, request: operation }: { userId: UserId, projectId: ProjectId, flowId: FlowId, request: FlowOperationRequest }): Promise<Flow> {
        const flowLock = await acquireLock({
            key: flowId,
            timeout: 10000,
        })
        const flow: Omit<Flow, 'version'> | null = (await flowRepo.findOneBy({ projectId, id: flowId }))
        if (isNil(flow)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id: flowId,
                },
            })
        }
        try {
            if (operation.type === FlowOperationType.CHANGE_FOLDER) {
                await flowRepo.update(flow.id, {
                    ...flow,
                    folderId: operation.request.folderId ? operation.request.folderId : null,
                })
            }
            else {
                let lastVersion = (await flowVersionService.getFlowVersion({
                    flowId,
                    versionId: undefined,
                    removeSecrets: false,
                }))
                if (lastVersion.state === FlowVersionState.LOCKED) {
                    const lastVersionWithArtifacts = (await flowVersionService.getFlowVersion({
                        flowId,
                        versionId: undefined,
                        removeSecrets: false,
                    }))
                    lastVersion = await flowVersionService.createEmptyVersion(flowId, {
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
            await flowLock.release()
        }
        return flowService.getOneOrThrow({ id: flowId, projectId })
    },
    async delete({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        await flowInstanceService.onFlowDelete({ projectId, flowId })
        await flowRepo.delete({ projectId, id: flowId })
    },
    async count(req: {
        projectId: string
        folderId?: string
    }): Promise<number> {
        if (req.folderId === undefined) {
            return flowRepo.count({ where: { projectId: req.projectId } })
        }
        if (req.folderId !== 'NULL') {
            return flowRepo.count({
                where: [{ folderId: req.folderId, projectId: req.projectId }],
            })
        }
        return flowRepo.count({
            where: [{ folderId: IsNull(), projectId: req.projectId }],
        })
    },

}

