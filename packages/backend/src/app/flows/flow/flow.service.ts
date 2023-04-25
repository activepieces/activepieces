import { FlowEntity } from './flow.entity'
import {
    apId,
    CreateFlowRequest,
    Cursor,
    EmptyTrigger,
    Flow,
    FlowId,
    FlowInstance,
    FlowInstanceStatus,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    Folder,
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
import { telemetry } from '../../helper/telemetry.utils'
import { flowInstanceService } from '../flow-instance/flow-instance.service'
import { IsNull } from 'typeorm'
import { flowFolderService } from '../folder/folder.service'


export const flowService = {
    async create({ projectId, request }: { projectId: ProjectId, request: CreateFlowRequest }): Promise<Flow> {
        const flow: Partial<Flow> = {
            id: apId(),
            projectId: projectId,
            folderId:request.folderId,
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
                    flowId: flow.id,
                },
            },
        )
        return {
            ...savedFlow,
            version: latestFlowVersion,
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
    async list({ projectId, cursorRequest, limit, folderId }: { projectId: ProjectId, cursorRequest: Cursor | null, limit: number, folderId: string | undefined }): Promise<SeekPage<Flow>> {
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
        const queryWhere = { projectId }
        if (folderId !== undefined) {
            queryWhere['folderId'] = (folderId === 'NULL' ? IsNull() : folderId)
        }

        const paginationResult = await paginator.paginate(flowRepo.createQueryBuilder('flow').where(queryWhere))
        const flowVersionsPromises: Array<Promise<FlowVersion | null>> = []
        const flowInstancesPromises:Array<Promise<FlowInstance|null>> =[]
        const foldersPromises:Array<Promise<Folder|null>> =[]
        paginationResult.data.forEach((flow) => {
            flowVersionsPromises.push(flowVersionService.getFlowVersion(projectId, flow.id, undefined, false))
            flowInstancesPromises.push(flowInstanceService.get({projectId: projectId, flowId: flow.id}))
            foldersPromises.push(flowFolderService.getOne({projectId,folderId:flow.folderId}));
        })
        const versions: Array<FlowVersion | null> = await Promise.all(flowVersionsPromises)
        const instances: Array<FlowInstance | null> = await Promise.all(flowInstancesPromises)
        const folders: Array<Folder | null> = await Promise.all(foldersPromises)
        paginationResult.data = paginationResult.data.map((flow, idx)=>{
            return {
                ...flow,
                version:versions[idx],
                status: instances[idx]? instances[idx].status : FlowInstanceStatus.UNPUBLISHED,
                folderDisplayName:folders[idx]? folders[idx].displayName : 'Uncategorized'
            }
        })
        return paginationHelper.createPage<Flow>(paginationResult.data, paginationResult.cursor)
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
        const instance = await flowInstanceService.get({projectId: projectId, flowId: flow.id})
        const folder = await flowFolderService.getOne({projectId, folderId:flow.folderId});
        return {
            ...flow,
            version: flowVersion,
            status: instance? instance.status : FlowInstanceStatus.UNPUBLISHED,
            folderDisplayName: folder? folder.displayName: 'Uncategorized'
        }
    },

    async update({ flowId, projectId, request }: { projectId: ProjectId, flowId: FlowId, request: FlowOperationRequest }): Promise<Flow | null> {
        const flowLock = await acquireLock({
            key: flowId,
            timeout: 5000,
        })
        const rawFlow = await flowRepo.findOneBy({ projectId: projectId, id: flowId })
        try {
            if (request.type === FlowOperationType.CHANGE_FOLDER) {
                rawFlow.folderId = request.request.folderId? request.request.folderId: null
                await flowRepo.update(rawFlow.id, rawFlow)
            }
            else {
                let lastVersion = (await flowVersionService.getFlowVersion(projectId, flowId, undefined, false))
                if (lastVersion.state === FlowVersionState.LOCKED) {
                    lastVersion = await flowVersionService.createVersion(flowId, lastVersion)
                }
                await flowVersionService.applyOperation(projectId, lastVersion, request)
            }
        }
        finally {
            await flowLock.release()
        }
        return await flowService.getOne({ id: flowId, versionId: undefined, projectId: projectId, includeArtifacts: false })
    },
    async delete({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        await flowInstanceService.onFlowDelete({ projectId, flowId })
        await flowRepo.delete({ projectId: projectId, id: flowId })
    },
    async count(req:{
        projectId:string
        folderId?:string
    }) :Promise<number>{
        if(req.folderId === undefined) {
            return flowRepo.count({where:{projectId:req.projectId}})
        }
        if(req.folderId !== 'NULL') {
            return flowRepo.count({
                where:[{folderId:req.folderId, projectId:req.projectId}],
            })
        }
        return flowRepo.count({
            where:[{folderId:IsNull(), projectId:req.projectId}],
        })
    },
    
}

