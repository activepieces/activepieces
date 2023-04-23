import { FlowEntity } from './flow.entity'
import {
    apId,
    CollectionId,
    CreateFlowRequest,
    Cursor,
    EmptyTrigger,
    Flow,
    FlowId,
    FlowOperationRequest,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    ProjectId,
    SeekPage,
    TelemetryEventName,
    TriggerType,
} from '@activepieces/shared'
import { flowVersionService } from '../flow-version/flow-version.service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { acquireLock } from '../../database/redis-connection'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowRepo } from './flow.repo'
import { instanceSideEffects } from '../../instance/instance-side-effects'
import { telemetry } from '../../helper/telemetry.utils'

export const flowService = {
    async create({ projectId, request }: { projectId: ProjectId, request: CreateFlowRequest }): Promise<Flow> {
        const flow: Partial<Flow> = {
            id: apId(),
            projectId: projectId,
            collectionId: request.collectionId,
        }
        const savedFlow = await flowRepo.save(flow)
        await flowVersionService.createVersion(savedFlow.id, {
            displayName: request.displayName,
            valid: false,
            trigger: {
                displayName: 'Select Trigger',
                name: 'trigger',
                type: TriggerType.EMPTY,
                settings: {},
                valid: false,
            } as EmptyTrigger,
        })
        const latestFlowVersion = await flowVersionService.getFlowVersion(projectId, savedFlow.id, undefined, false)
        telemetry.trackProject(
            savedFlow.projectId,
            {
                name: TelemetryEventName.FLOW_CREATED,
                payload: {
                    collectionId: flow.collectionId!,
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
        const flow = await flowService.getOne({ projectId, id, versionId: undefined, includeArtifacts: false })

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
    async list({ projectId, collectionId, cursorRequest, limit }: { projectId: ProjectId, collectionId: CollectionId, cursorRequest: Cursor | null, limit: number }): Promise<SeekPage<Flow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: FlowEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = flowRepo.createQueryBuilder('flow').where({ collectionId, projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ collectionId }))
        const flowVersionsPromises: Array<Promise<FlowVersion | null>> = []
        data.forEach((collection) => {
            flowVersionsPromises.push(flowVersionService.getFlowVersion(projectId, collection.id, undefined, false))
        })
        const versions: Array<FlowVersion | null> = await Promise.all(flowVersionsPromises)
        for (let i = 0; i < data.length; ++i) {
            data[i] = { ...data[i], version: versions[i]! }
        }
        return paginationHelper.createPage<Flow>(data, cursor)
    },
    async getOne({ projectId, id, versionId, includeArtifacts = true }: { projectId: ProjectId, id: FlowId, versionId: FlowVersionId | undefined, includeArtifacts: boolean }): Promise<Flow | null> {
        const flow: Flow | null = await flowRepo.findOneBy({
            projectId,
            id,
        })
        if (flow === null) {
            return null
        }
        const flowVersion = await flowVersionService.getFlowVersion(projectId, id, versionId, includeArtifacts)
        return {
            ...flow,
            version: flowVersion!,
        }
    },
    async update({ flowId, projectId, request }: { projectId: ProjectId, flowId: FlowId, request: FlowOperationRequest }): Promise<Flow | null> {
        const flowLock = await acquireLock({
            key: flowId,
            timeout: 5000,
        })
        try {
            let lastVersion = (await flowVersionService.getFlowVersion(projectId, flowId, undefined, false))
            if (lastVersion!.state === FlowVersionState.LOCKED) {
                lastVersion = await flowVersionService.createVersion(flowId, lastVersion!)
            }
            await flowVersionService.applyOperation(projectId, lastVersion!, request)
        }
        finally {
            await flowLock.release()
        }
        return await flowService.getOne({ id: flowId, versionId: undefined, projectId: projectId, includeArtifacts: false })
    },
    async delete({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        await instanceSideEffects.onFlowDelete({ projectId, flowId })

        await flowRepo.delete({ projectId: projectId, id: flowId })
    },
}
