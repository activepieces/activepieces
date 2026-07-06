import { isNil, ProjectId } from '@activepieces/core-utils'
import { ApEdition, FileType, FlowActionType, FlowOperationRequest, FlowOperationType, flowStructureUtil, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { prewarmPieceCache, PieceRef } from '../../workers/rpc/prewarm-piece-cache'
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
            await handlePrewarmCacheUpdate(projectId, operation, log)
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

// The boot-time piece prewarm keeps an append-only list of the pieces a platform's flows use. When an
// operation introduces a piece, add it so the next worker (re)connect installs it. Cloud never prewarms.
async function handlePrewarmCacheUpdate(projectId: ProjectId, operation: FlowOperationRequest, log: FastifyBaseLogger): Promise<void> {
    if (system.getEdition() === ApEdition.CLOUD) {
        return
    }
    const pieces = extractOperationPieceRefs(operation)
    if (pieces.length === 0) {
        return
    }
    const platformId = await projectService(log).getPlatformId(projectId)
    await prewarmPieceCache.append(platformId, pieces)
}

function extractOperationPieceRefs(operation: FlowOperationRequest): PieceRef[] {
    switch (operation.type) {
        case FlowOperationType.ADD_ACTION ||  FlowOperationType.UPDATE_ACTION || FlowOperationType.UPDATE_TRIGGER:
            return operation.request.action.type === FlowActionType.PIECE
                ? [{ pieceName: operation.request.action.settings.pieceName, pieceVersion: operation.request.action.settings.pieceVersion }]
                : []
        case FlowOperationType.IMPORT_FLOW:
            return flowStructureUtil.getAllSteps(operation.request.trigger).flatMap((step) =>
                step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE
                    ? [{ pieceName: step.settings.pieceName, pieceVersion: step.settings.pieceVersion }]
                    : [],
            )
        default:
            return []
    }
}