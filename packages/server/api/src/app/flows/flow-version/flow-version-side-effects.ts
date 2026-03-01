import { exceptionHandler } from '@activepieces/server-common'
import {
    FileType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    PieceTrigger,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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
})


async function handleSampleDataDeletion(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest, log: FastifyBaseLogger): Promise<void> {
    if (operation.type !== FlowOperationType.UPDATE_TRIGGER && operation.type !== FlowOperationType.DELETE_ACTION) {
        return
    }
    switch (operation.type) {
        case FlowOperationType.UPDATE_TRIGGER:
        {
            const stepToDelete = flowStructureUtil.getStepOrThrow(operation.request.id, flowVersion)
            const triggerNode = flowStructureUtil.getTriggerNode(flowVersion.graph)
            const triggerData = triggerNode?.data as PieceTrigger | undefined
            const triggerChanged = operation.type === FlowOperationType.UPDATE_TRIGGER && (triggerNode?.data.kind !== operation.request.kind
                    || triggerData?.settings.triggerName !== operation.request.settings.triggerName
                    || triggerData?.settings.pieceName !== operation.request.settings.pieceName)
            const stepSettings = stepToDelete.data.settings as Record<string, Record<string, unknown>>
            const sampleDataExists = !isNil(stepSettings.sampleData?.sampleDataFileId)
            if (triggerChanged && sampleDataExists) {
                await sampleDataService(log).deleteForStep({
                    projectId,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    fileId: stepSettings.sampleData.sampleDataFileId as string,
                    fileType: FileType.SAMPLE_DATA,
                })
            }
            const sampleDataInputExists = !isNil(stepSettings.sampleData?.sampleDataInputFileId)
            if (triggerChanged && sampleDataInputExists) {
                await sampleDataService(log).deleteForStep({
                    projectId,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    fileId: stepSettings.sampleData.sampleDataInputFileId as string,
                    fileType: FileType.SAMPLE_DATA_INPUT,
                })
            }
            break
        }
        case FlowOperationType.DELETE_ACTION: {
            const stepsToDelete = operation.request.names.map(name => flowStructureUtil.getStepOrThrow(name, flowVersion))
            for (const step of stepsToDelete) {
                const stepSettings = step.data.settings as Record<string, Record<string, unknown>>
                const sampleDataExists = !isNil(stepSettings.sampleData?.sampleDataFileId)
                if (sampleDataExists) {
                    await sampleDataService(log).deleteForStep({
                        projectId,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        fileId: stepSettings.sampleData.sampleDataFileId as string,
                        fileType: FileType.SAMPLE_DATA,
                    })
                }
                const sampleDataInputExists = !isNil(stepSettings.sampleData?.sampleDataInputFileId)
                if (sampleDataInputExists) {
                    await sampleDataService(log).deleteForStep({
                        projectId,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        fileId: stepSettings.sampleData.sampleDataInputFileId as string,
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