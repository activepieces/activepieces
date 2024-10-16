import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    flowHelper,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    isNil,
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
            await handleSampleDataDeletion(projectId, flowVersion, operation)
            await handleUpdateTriggerWebhookSimulation(projectId, flowVersion, operation)
        }
        catch (e) {
            // Ignore error and continue the operation peacefully
            exceptionHandler.handle(e)
        }
    },
}

async function handleSampleDataDeletion(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest): Promise<void> {
    if (operation.type !== FlowOperationType.UPDATE_TRIGGER && operation.type !== FlowOperationType.DELETE_ACTION) {
        return
    }
    const stepToDelete = flowHelper.getStep(flowVersion, operation.request.name)
    const triggerChanged = operation.type === FlowOperationType.UPDATE_TRIGGER && (flowVersion.trigger.type !== operation.request.type 
        || flowVersion.trigger.settings.triggerName !== operation.request.settings.triggerName
        || flowVersion.trigger.settings.pieceName !== operation.request.settings.pieceName)
    
    const actionDeleted = operation.type === FlowOperationType.DELETE_ACTION
    const deleteSampleData = triggerChanged || actionDeleted
    const sampleDataExists = !isNil(stepToDelete?.settings.inputUiInfo?.sampleDataFileId)
    if (deleteSampleData && sampleDataExists) {
        await sampleDataService.deleteForStep({
            projectId,
            flowVersionId: flowVersion.id,
            flowId: flowVersion.flowId,
            sampleDataFileId: stepToDelete.settings.inputUiInfo.sampleDataFileId,
        })
    }
}

async function handleUpdateTriggerWebhookSimulation(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest): Promise<void> {
    if (operation.type === FlowOperationType.UPDATE_TRIGGER) {
        await deleteWebhookSimulation({
            projectId,
            flowId: flowVersion.flowId,
        })
    }
}
