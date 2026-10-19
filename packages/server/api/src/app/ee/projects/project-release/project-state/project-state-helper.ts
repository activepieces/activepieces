import { ActivepiecesError, isEmpty, isNil } from '@activepieces/core-utils'
import { FlowOperationType, FlowState, FlowStatus, flowStructureUtil, FlowSyncError, FlowVersion, PopulatedFlow } from '@activepieces/shared'
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
            emitEvents: false,
        })
        return this.updateFlowInProject(createdFlow, flow, projectId)
    },

    async updateFlowInProject(originalFlow: FlowState, newFlow: FlowState,
        projectId: string,
    ): Promise<PopulatedFlow> {
        const project = await projectService(log).getOneOrThrow(projectId)

        const newFlowVersion = mergeDestinationAuth({ destinationVersion: originalFlow.version, incomingVersion: newFlow.version })
        const updatedFlow = await flowService(log).update({
            id: originalFlow.id,
            projectId,
            platformId: project.platformId,
            userId: null,
            emitEvents: false,
            operation: {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: newFlow.version.displayName,
                    trigger: newFlowVersion.trigger,
                    schemaVersion: newFlow.version.schemaVersion,
                    notes: newFlow.version.notes,
                },
            },
        })

        if (!isNil(updatedFlow.publishedVersionId)) {
            await flowService(log).update({
                id: updatedFlow.id,
                projectId,
                platformId: project.platformId,
                userId: null,
                emitEvents: false,
                operation: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: newFlow.status,
                    },
                },
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
            const project = await projectService(log).getOneOrThrow(projectId)
            await flowService(log).update({
                id: flow.id,
                projectId,
                platformId: project.platformId,
                userId: null,
                emitEvents: false,
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
            const reason = e instanceof ActivepiecesError && typeof e.error.params === 'object' && !isNil(e.error.params) && 'message' in e.error.params
                ? String(e.error.params.message)
                : undefined
            return {
                flowId: flow.id,
                message: isNil(reason)
                    ? `Failed to publish flow ${flow.version.displayName} #${flow.id}`
                    : `Failed to publish flow ${flow.version.displayName} #${flow.id}: ${reason}`,
            }
        }
    },

    async deleteFlowFromProject(flowId: string, projectId: string): Promise<void> {
        const flow = await flowService(log).getOne({ id: flowId, projectId })
        if (!flow) {
            return
        }
        await flowService(log).delete({ id: flowId, projectId, emitEvents: false })
    },
})

export function mergeDestinationAuth({ destinationVersion, incomingVersion }: MergeDestinationAuthParams): FlowVersion {
    return flowStructureUtil.transferFlow(incomingVersion, (step) => {
        const destinationStep = flowStructureUtil.getStep(step.name, destinationVersion.trigger)
        const destinationAuth = destinationStep?.settings?.input?.auth
        const samePiece = destinationStep?.settings?.pieceName === step.settings?.pieceName
        const incomingInput = step.settings?.input
        if (!isEmpty(destinationAuth) && samePiece && !isNil(incomingInput) && isEmpty(incomingInput.auth)) {
            incomingInput.auth = destinationAuth
        }
        return step
    })
}

type MergeDestinationAuthParams = {
    destinationVersion: FlowVersion
    incomingVersion: FlowVersion
}

export type RepublishFlowParams = {
    flow: PopulatedFlow
    projectId: string
    status?: FlowStatus
}