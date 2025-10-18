import { FlowOperationType, FlowState, FlowStatus, flowStructureUtil, FlowSyncError, isNil, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../../flows/flow/flow.service'
import { projectService } from '../../../../project/project-service'
export const projectStateHelper = (log: FastifyBaseLogger) => ({
    async createFlowInProject(flow: PopulatedFlow, projectId: string): Promise<PopulatedFlow> {
        const createdFlow = await flowService(log).create({
            projectId,
            request: {
                displayName: flow.version.displayName,
                projectId,
            },
            externalId: flow.externalId,
        })
        return this.updateFlowInProject(createdFlow, flow, projectId)
    },

    async updateFlowInProject(originalFlow: FlowState, newFlow: FlowState,
        projectId: string,
    ): Promise<PopulatedFlow> {
        const project = await projectService.getOneOrThrow(projectId)

        const newFlowVersion = flowStructureUtil.transferFlow(newFlow.version, (step) => {
            const oldStep = flowStructureUtil.getStep(step.name, originalFlow.version.trigger)
            const isNotEmptyTrigger = !isNil(step.settings?.input)
            if (oldStep?.settings?.input?.auth && isNotEmptyTrigger) {
                step.settings.input.auth = oldStep.settings.input.auth
            }
            return step
        })
        const updatedFlow = await flowService(log).update({
            id: originalFlow.id,
            projectId,
            platformId: project.platformId,
            userId: project.ownerId,
            operation: {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: newFlow.version.displayName,
                    trigger: newFlowVersion.trigger,
                    schemaVersion: newFlow.version.schemaVersion,
                },
            },
        })

        if (!isNil(updatedFlow.publishedVersionId)) {
            await flowService(log).updateStatus({
                id: updatedFlow.id,
                projectId,
                newStatus: newFlow.status,
            })
        }

        return updatedFlow
    },

    async republishFlow({ flow, projectId, status }: RepublishFlowParams): Promise<FlowSyncError | null> {
        if (!flow.version.valid) {
            return {
                flowId: flow.id,
                message: `Flow ${flow.version.displayName} #${flow.id} is not valid`,
            }
        }
        try {
            const project = await projectService.getOneOrThrow(projectId)
            await flowService(log).update({
                id: flow.id,
                projectId,
                platformId: project.platformId,
                userId: project.ownerId,
                operation: {
                    type: FlowOperationType.LOCK_AND_PUBLISH,
                    request: {
                        status: status ?? FlowStatus.ENABLED,
                    },
                },
            })
            return null
        }
        catch (e) {
            return {
                flowId: flow.id,
                message: `Failed to publish flow ${flow.version.displayName} #${flow.id}`,
            }
        }
    },

    async deleteFlowFromProject(flowId: string, projectId: string): Promise<void> {
        const flow = await flowService(log).getOne({ id: flowId, projectId })
        if (!flow) {
            return
        }
        await flowService(log).delete({ id: flowId, projectId })
    },
})

type RepublishFlowParams = {
    flow: PopulatedFlow
    projectId: string
    status?: FlowStatus
}