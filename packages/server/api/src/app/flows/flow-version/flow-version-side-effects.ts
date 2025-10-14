import { exceptionHandler } from '@activepieces/server-shared'
import {
    FileType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    isNil,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { mcpService } from '../../mcp/mcp-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { flowService } from '../flow/flow.service'
import { sampleDataService } from '../step-run/sample-data.service'

type OnApplyOperationParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    operation: FlowOperationRequest
}


export const flowVersionSideEffects = (log: FastifyBaseLogger) => ({
    async preApplyOperation({
        projectId,
        flowVersion,
        operation,
    }: OnApplyOperationParams): Promise<void> {
        try {
            await handleSampleDataDeletion(projectId, flowVersion, operation, log)
            await handleUpdateTriggerWebhookSimulation(projectId, flowVersion, operation, log)
            await handleUpdateFlowLastModified(projectId, flowVersion, log)
        }
        catch (e) {
            // Ignore error and continue the operation peacefully
            exceptionHandler.handle(e, log)
        }
    },
    async postApplyOperation({
        flowVersion,
        operation,
    }: PostApplyOperation): Promise<void> {
        const isNotMcpTrigger =  !isMcpTriggerPiece(flowVersion) && [FlowOperationType.LOCK_AND_PUBLISH, FlowOperationType.LOCK_FLOW].includes(operation.type)
        if (isNotMcpTrigger) {
            await mcpService(log).deleteFlowTool({ flowId: flowVersion.flowId })
        }
    },
})

type PostApplyOperation = {
    flowVersion: FlowVersion
    operation: FlowOperationRequest
}
function isMcpTriggerPiece(flowVersion: FlowVersion): boolean {
    return flowVersion.trigger.type === FlowTriggerType.PIECE && 
           flowVersion.trigger.settings.pieceName === '@activepieces/piece-mcp'
}

async function handleSampleDataDeletion(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest, log: FastifyBaseLogger): Promise<void> {
    if (operation.type !== FlowOperationType.UPDATE_TRIGGER && operation.type !== FlowOperationType.DELETE_ACTION) {
        return
    }
    switch (operation.type) {
        case FlowOperationType.UPDATE_TRIGGER:
        {
            const stepToDelete = flowStructureUtil.getStepOrThrow(operation.request.name, flowVersion.trigger)
            const triggerChanged = operation.type === FlowOperationType.UPDATE_TRIGGER && (flowVersion.trigger.type !== operation.request.type
                    || flowVersion.trigger.settings.triggerName !== operation.request.settings.triggerName
                    || flowVersion.trigger.settings.pieceName !== operation.request.settings.pieceName)
            const sampleDataExists = !isNil(stepToDelete?.settings.sampleData?.sampleDataFileId)
            if (triggerChanged && sampleDataExists) {
                await sampleDataService(log).deleteForStep({
                    projectId,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    fileId: stepToDelete.settings.sampleData.sampleDataFileId,
                    fileType: FileType.SAMPLE_DATA,
                })
            }
            const sampleDataInputExists = !isNil(stepToDelete?.settings.sampleData?.sampleDataInputFileId)
            if (triggerChanged && sampleDataInputExists) {
                await sampleDataService(log).deleteForStep({
                    projectId,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    fileId: stepToDelete.settings.sampleData.sampleDataInputFileId,
                    fileType: FileType.SAMPLE_DATA_INPUT,
                })
            }
            break
        }
        case FlowOperationType.DELETE_ACTION: {
            const stepsToDelete = operation.request.names.map(name => flowStructureUtil.getStepOrThrow(name, flowVersion.trigger))
            for (const step of stepsToDelete) {
                const sampleDataExists = !isNil(step.settings.sampleData?.sampleDataFileId)
                if (sampleDataExists) {
                    await sampleDataService(log).deleteForStep({
                        projectId,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        fileId: step.settings.sampleData.sampleDataFileId,
                        fileType: FileType.SAMPLE_DATA,
                    })
                }
                const sampleDataInputExists = !isNil(step.settings.sampleData?.sampleDataInputFileId)
                if (sampleDataInputExists) {
                    await sampleDataService(log).deleteForStep({
                        projectId,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        fileId: step.settings.sampleData.sampleDataInputFileId,
                        fileType: FileType.SAMPLE_DATA_INPUT,
                    })
                }
            }
            break
        }
        default:
            return
    }

}

async function handleUpdateTriggerWebhookSimulation(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest, log: FastifyBaseLogger): Promise<void> {
    if (operation.type === FlowOperationType.UPDATE_TRIGGER) {
        await triggerSourceService(log).disable({
            flowId: flowVersion.flowId,
            projectId,
            simulate: true,
            ignoreError: true,
        })
    }
}

async function handleUpdateFlowLastModified(projectId: ProjectId, flowVersion: FlowVersion, log: FastifyBaseLogger): Promise<void> {
    await flowService(log).updateLastModified(flowVersion.flowId, projectId)
}