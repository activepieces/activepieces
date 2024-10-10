import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    flowHelper,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    ProjectId,
} from '@activepieces/shared'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { sampleDataService } from '../step-run/sample-data.service'

type OnApplyOperationParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    operation: FlowOperationRequest
}

type DeleteWebhookSimulationParams = {
    projectId: ProjectId
    flowId: FlowId
}

const deleteWebhookSimulation = async (
    params: DeleteWebhookSimulationParams,
): Promise<void> => {
    const { projectId, flowId } = params

    try {
        await webhookSimulationService.delete({
            projectId,
            flowId,
        })
    }
    catch (e: unknown) {
        const notWebhookSimulationNotFoundError = !(
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.ENTITY_NOT_FOUND
        )
        if (notWebhookSimulationNotFoundError) {
            throw e
        }
    }
}

export const flowVersionSideEffects = {
    async preApplyOperation({
        projectId,
        flowVersion,
        operation,
    }: OnApplyOperationParams): Promise<void> {
        try {
            if (operation.type === FlowOperationType.DELETE_ACTION) {
                const step = flowHelper.getStep(flowVersion, operation.request.name)
                if (step && step.settings.inputUiInfo?.sampleDataFileId) {
                    await sampleDataService.deleteForStep({
                        projectId,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        sampleDataFileId: step.settings.inputUiInfo?.sampleDataFileId,
                    })
                }
            }
            if (operation.type === FlowOperationType.UPDATE_TRIGGER) {
                await deleteWebhookSimulation({
                    projectId,
                    flowId: flowVersion.flowId,
                })
            }
        }
        catch (e) {
            // Ignore error and continue the operation peacefully
            exceptionHandler.handle(e)
        }
    },
}
