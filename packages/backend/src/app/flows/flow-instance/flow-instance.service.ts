import { ActivepiecesError, ErrorCode, FlowInstance, FlowInstanceStatus, FlowOperationType, ProjectId, ScheduleOptions, ScheduleType, UpsertFlowInstanceRequest, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { FlowInstanceEntity } from './flow-instance.entity'
import { triggerUtils } from '../../helper/trigger-utils'
import { flowService } from '../flow/flow.service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { isNil } from '@activepieces/shared'

export const flowInstanceRepo = databaseConnection.getRepository<FlowInstance>(FlowInstanceEntity)

export const flowInstanceService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertFlowInstanceRequest }): Promise<FlowInstance> {
        const flow = await flowService.update({
            flowId: request.flowId, projectId: projectId, request: {
                type: FlowOperationType.LOCK_FLOW,
                request: {
                    flowId: request.flowId,
                },
            },
        })

        const flowInstance: Partial<FlowInstance> = {
            id: apId(),
            projectId: projectId,
            flowId: request.flowId,
            flowVersionId: flow.version.id,
            status: FlowInstanceStatus.ENABLED,
        }
        const oldInstance: FlowInstance | null = await flowInstanceRepo.findOneBy({ projectId, flowId: request.flowId })
        if (oldInstance && oldInstance.status === FlowInstanceStatus.ENABLED) {
            await triggerUtils.disable({
                flowVersion: await flowVersionService.getOneOrThrow(oldInstance.flowVersionId),
                projectId: oldInstance.projectId,
                simulate: false,
            })
        }

        const enableResult = await triggerUtils.enable({
            flowVersion: flow.version,
            projectId: projectId,
            simulate: false,
        })
        const scheduleOptions = enableResult?.result.scheduleOptions
        flowInstance.schedule = isNil(scheduleOptions) ? undefined : {
            type: ScheduleType.CRON_EXPRESSION,
            timezone: scheduleOptions.timezone,
            cronExpression: scheduleOptions.cronExpression,
        }
        await flowInstanceRepo.upsert(flowInstance, ['projectId', 'flowId'])
        return flowInstanceRepo.findOneByOrFail({
            projectId: projectId,
            flowId: request.flowId,
        })
    },
    async get({ projectId, flowId }: { projectId: ProjectId, flowId: string }): Promise<FlowInstance | null> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
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
        let scheduleOptions: ScheduleOptions | undefined
        if (flowInstance.status !== status) {
            switch (status) {
                case FlowInstanceStatus.ENABLED: {
                    const response = await triggerUtils.enable({
                        flowVersion: flowVersion,
                        projectId: flowInstance.projectId,
                        simulate: false,
                    })
                    scheduleOptions = response?.result.scheduleOptions
                    break
                }
                case FlowInstanceStatus.DISABLED:
                    await triggerUtils.disable({
                        flowVersion: flowVersion,
                        projectId: flowInstance.projectId,
                        simulate: false,
                    })
                    break
                case FlowInstanceStatus.UNPUBLISHED:
                    break
            }
        }
        const updatedInstance: FlowInstance = {
            ...flowInstance,
            status: status,
            schedule: isNil(scheduleOptions) ? undefined : {
                type: ScheduleType.CRON_EXPRESSION,
                timezone: scheduleOptions.timezone,
                cronExpression: scheduleOptions.cronExpression,
            },
        }
        await flowInstanceRepo.upsert(updatedInstance, ['projectId', 'flowId'])
        return flowInstanceRepo.findOneByOrFail({
            projectId: projectId,
            flowId: flowInstance.flowId,
        })
    },
    async onFlowDelete({ projectId, flowId }: { projectId: ProjectId, flowId: string }): Promise<void> {
        const flowInstance = await flowInstanceRepo.findOneBy({ projectId, flowId })
        if (flowInstance) {
            const flowVersion = await flowVersionService.getOneOrThrow(flowInstance.flowVersionId)
            if (flowInstance.status === FlowInstanceStatus.ENABLED) {
                await triggerUtils.disable({
                    flowVersion: flowVersion,
                    projectId: flowInstance.projectId,
                    simulate: false,
                })
            }
            await flowInstanceRepo.delete({ projectId, flowId })
        }
    },
}
