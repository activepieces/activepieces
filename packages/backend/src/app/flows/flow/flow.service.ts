import { FlowEntity } from './flow.entity'
import {
    apId,
    CreateFlowRequest,
    Cursor,
    Flow,
    FlowId,
    FlowInstance,
    FlowInstanceStatus,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    FlowViewMode,
    ProjectId,
    SeekPage,
    TelemetryEventName,
} from '@activepieces/shared'
import { flowVersionService } from '../flow-version/flow-version.service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { acquireLock } from '../../database/redis-connection'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowRepo } from './flow.repo'
import { telemetry } from '../../helper/telemetry.utils'
import { flowInstanceService } from '../flow-instance/flow-instance.service'
import { IsNull } from 'typeorm'
import { isNil } from '@activepieces/shared'

export const flowService = {
    async create({ projectId, request }: { projectId: ProjectId, request: CreateFlowRequest }): Promise<Flow> {
        const flow: Partial<Flow> = {
            id: apId(),
            projectId: projectId,
            folderId: request.folderId,
        }
        const savedFlow = await flowRepo.save(flow)
        await flowVersionService.createEmptyVersion(savedFlow.id, {
            displayName: request.displayName,
        })
        const latestFlowVersion = await flowVersionService.getFlowVersion(projectId, savedFlow.id, undefined, FlowViewMode.NO_ARTIFACTS)
        telemetry.trackProject(
            savedFlow.projectId,
            {
                name: TelemetryEventName.FLOW_CREATED,
                payload: {
                    flowId: flow.id!,
                },
            },
        )
        return {
            ...savedFlow,
            version: latestFlowVersion!,
        }
    },
    async getOneOrThrow({ projectId, id }: { projectId: ProjectId, id: FlowId }): Promise<Flow> {
        const flow = await flowService.getOne({ projectId, id, versionId: undefined, viewMode: FlowViewMode.NO_ARTIFACTS })

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
            flowVersionsPromises.push(flowVersionService.getFlowVersion(projectId, flow.id, undefined, FlowViewMode.NO_ARTIFACTS))
            flowInstancesPromises.push(flowInstanceService.get({ projectId: projectId, flowId: flow.id }))
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
    async getOne({ projectId, id, versionId, viewMode = FlowViewMode.NO_ARTIFACTS }: { projectId: ProjectId, id: FlowId, versionId: FlowVersionId | undefined, viewMode: FlowViewMode }): Promise<Flow | null> {
        const flow: Flow | null = await flowRepo.findOneBy({
            projectId,
            id,
        })
        if (flow === null) {
            return null
        }
        const flowVersion = (await flowVersionService.getFlowVersion(projectId, id, versionId, viewMode))!
        const instance = await flowInstanceService.get({ projectId: projectId, flowId: flow.id })
        return {
            ...flow,
            version: flowVersion,
            status: instance ? instance.status : FlowInstanceStatus.UNPUBLISHED,
        }
    },

    async update({ flowId, projectId, request: operation }: { projectId: ProjectId, flowId: FlowId, request: FlowOperationRequest }): Promise<Flow> {
        const flowLock = await acquireLock({
            key: flowId,
            timeout: 10000,
        })
        const flow: Omit<Flow, 'version'> | null = (await flowRepo.findOneBy({ projectId: projectId, id: flowId }))
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
                    folderId: operation.request.folderId ?? undefined,
                })
            }
            else {
                let lastVersion = (await flowVersionService.getFlowVersion(projectId, flowId, undefined, FlowViewMode.NO_ARTIFACTS))!
                if (lastVersion.state === FlowVersionState.LOCKED) {
                    const lastVersionWithArtifacts = (await flowVersionService.getFlowVersion(projectId, flowId, undefined, FlowViewMode.WITH_ARTIFACTS))!
                    lastVersion = await flowVersionService.createEmptyVersion(flowId, {
                        displayName: lastVersionWithArtifacts.displayName,
                    })
                    // Duplicate the artifacts from the previous version, otherwise they will be deleted during update operation
                    lastVersion = await flowVersionService.applyOperation(projectId, lastVersion, {
                        type: FlowOperationType.IMPORT_FLOW,
                        request: lastVersionWithArtifacts,
                    })
                }
                await flowVersionService.applyOperation(projectId, lastVersion, operation)
            }
        }
        finally {
            await flowLock.release()
        }
        return (await flowService.getOne({ id: flowId, versionId: undefined, projectId: projectId, viewMode: FlowViewMode.NO_ARTIFACTS }))!
    },
    async delete({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        await flowInstanceService.onFlowDelete({ projectId, flowId })
        await flowRepo.delete({ projectId: projectId, id: flowId })
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

