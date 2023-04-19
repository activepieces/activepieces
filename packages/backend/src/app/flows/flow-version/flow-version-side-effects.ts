import { FlowOperationRequest, FlowOperationType, FlowVersion, ProjectId } from '@activepieces/shared'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'

type OnApplyOperationParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    operation: FlowOperationRequest
}

export const flowVersionSideEffects = {
    async onApplyOperation({ projectId, flowVersion, operation }: OnApplyOperationParams): Promise<void> {
        if (operation.type === FlowOperationType.UPDATE_TRIGGER) {
            await webhookSimulationService.delete({
                projectId,
                flowId: flowVersion.flowId,
            })
        }
    },
}
