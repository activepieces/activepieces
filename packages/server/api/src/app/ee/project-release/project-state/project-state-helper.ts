import { FlowOperationType, FlowState, FlowStatus, flowStructureUtil, isNil, PopulatedFlow, ProjectSyncError } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
import { projectService } from '../../../project/project-service'
export const projectStateHelper = (log: FastifyBaseLogger) => ({
    async getStateFromDB(projectId: string): Promise<FlowState[]> {
        const flows = await flowRepo().find({
            where: {
                projectId,
            },
        })
        const allPopulatedFlows = await Promise.all(flows.map(async (flow) => {
            return flowService(log).getOnePopulatedOrThrow({
                id: flow.id,
                projectId,
            })
        }))
        return allPopulatedFlows
    },

    async createFlowInProject(flow: PopulatedFlow, projectId: string): Promise<PopulatedFlow> {
        const createdFlow = await flowService(log).create({
            projectId,
            request: {
                displayName: flow.version.displayName,
                projectId,
            },
            externalId: flow.externalId || flow.id,
        })
        return this.updateFlowInProject(createdFlow, flow, projectId)
    },

    async updateFlowInProject(originalFlow: FlowState, newFlow: FlowState,
        projectId: string,
    ): Promise<PopulatedFlow> {
        const project = await projectService.getOneOrThrow(projectId)

        const newFlowVersion = flowStructureUtil.transferFlow(newFlow.version, (step) => {
            const oldStep = flowStructureUtil.getStep(step.name, originalFlow.version.trigger)
            if (oldStep?.settings?.input?.auth) {
                step.settings.input.auth = oldStep.settings.input.auth
            }
            return step
        })
        const updatedFlow = await flowService(log).update({
            id: originalFlow.id,
            projectId,
            platformId: project.platformId,
            lock: true,
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

    async republishFlow({ flowId, projectId, status }: RepublishFlowParams): Promise<ProjectSyncError | null> {
        const project = await projectService.getOneOrThrow(projectId)
        const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
        if (!flow) {
            return null
        }
        if (!flow.version.valid) {
            return {
                flowId,
                message: `Flow ${flow.version.displayName} #${flow.id} is not valid`,
            }
        }
        try {
            await flowService(log).update({
                id: flowId,
                projectId,
                platformId: project.platformId,
                lock: true,
                userId: project.ownerId,
                operation: {
                    type: FlowOperationType.LOCK_AND_PUBLISH,
                    request: {},
                },
            })

            await flowService(log).updateStatus({
                id: flowId,
                projectId,
                newStatus: status,
            })

            return null
        }
        catch (e) {
            return {
                flowId,
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
    flowId: string
    projectId: string
    status: FlowStatus
}