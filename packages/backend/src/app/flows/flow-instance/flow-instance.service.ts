import { ActivepiecesError, ErrorCode, FlowInstance, FlowInstanceStatus, FlowVersionState, ProjectId, UpsertFlowInstanceRequest, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { FlowInstanceEntity } from './flow-instance.entity'
import { triggerUtils } from '../../helper/trigger-utils'
import { flowService } from '../flow/flow.service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { isNil } from 'lodash'


export const flowInstanceRepo = databaseConnection.getRepository(FlowInstanceEntity)

export const flowInstanceService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertFlowInstanceRequest }): Promise<FlowInstance> {
        const flow = await flowService.getOneOrThrow({ projectId: projectId, id: request.flowId })
        if (flow == null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id: request.flowId,
                },
            })
        }

        const flowInstance: Partial<FlowInstance> = {
            id: apId(),
            projectId: projectId,
            flowId: request.flowId,
            flowVersionId: flow.version.id,
            status: FlowInstanceStatus.ENABLED,
        }
        if (flow.version.state === FlowVersionState.DRAFT) {
            flow.version.state = FlowVersionState.LOCKED
            await flowVersionService.overwriteVersion(flow.version.id, flow.version)
        }
        const oldInstance: Partial<FlowInstance | null> = await flowInstanceRepo.findOneBy({ projectId, flowId: request.flowId })
        if (oldInstance) {
            triggerUtils.disable({
                flowVersion: flow.version,
                projectId: oldInstance.projectId,
                simulate: false,
            })
        }

        triggerUtils.enable({
            flowVersion: flow.version,
            projectId: flowInstance.projectId,
            simulate: false,
        })
        await flowInstanceRepo.upsert(flowInstance, ['projectId', 'flowId'])

        return flowInstanceRepo.findOneBy({
            projectId: projectId,
            flowId: request.flowId,
        })
    },
    async getOneOrThrow({ projectId, flowId }: { projectId: ProjectId, flowId: string }): Promise<FlowInstance> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
        if (flowInstance == null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_INSTANCE_NOT_FOUND,
                params: {
                    id: flowId,
                },
            })
        }
        return flowInstance
    },
    async update({ projectId, flowId, status }: { projectId: ProjectId, flowId: string, status: FlowInstanceStatus }): Promise<FlowInstance> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
        if (flowInstance == null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_INSTANCE_NOT_FOUND,
                params: {
                    id: flowId,
                },
            })
        }
        const flowVersion = await flowVersionService.getOneOrThrow(flowInstance.flowVersionId)
        if (flowInstance.status !== status) {
            switch (status) {
                case FlowInstanceStatus.ENABLED:
                    triggerUtils.enable({
                        flowVersion: flowVersion,
                        projectId: flowInstance.projectId,
                        simulate: false,
                    })
                    break
                case FlowInstanceStatus.DISABLED:
                    triggerUtils.disable({
                        flowVersion: flowVersion,
                        projectId: flowInstance.projectId,
                        simulate: false,
                    })
                    break
            }
        }
        await flowInstanceRepo.upsert({
            ...flowInstance,
            status: status,
        }, ['projectId', 'flowId'])
        return flowInstance
    },
    async delete({ projectId, flowId }: { projectId: ProjectId, flowId: string }): Promise<void> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
        if (isNil(flowInstance)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_INSTANCE_NOT_FOUND,
                params: {
                    id: flowId,
                },
            })
        }
        const flowVersion = await flowVersionService.getOneOrThrow(flowInstance.flowVersionId)
        await triggerUtils.disable({
            flowVersion: flowVersion,
            projectId: flowInstance.projectId,
            simulate: false,
        })
        await flowInstanceRepo.delete({ projectId, flowId })
    },
    async onFlowDelete({ projectId, flowId }: { projectId: ProjectId, flowId: string }): Promise<void> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
        const flowVersion = await flowVersionService.getOneOrThrow(flowInstance.flowVersionId)
        if (flowInstance) {
            await triggerUtils.disable({
                flowVersion: flowVersion,
                projectId: flowInstance.projectId,
                simulate: false,
            })
            await flowInstanceRepo.delete({ projectId, flowId })
        }   
    },
}
