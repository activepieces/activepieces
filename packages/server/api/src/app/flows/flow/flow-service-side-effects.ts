import {
    FileType,
    Flow,
    FlowStatus,
    FlowVersion,
    isNil,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { triggerService } from '../../trigger/trigger-service'
import { sampleDataService } from '../step-run/sample-data.service'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        newStatus,
        flowToUpdate,
        publishedFlowVersion,
    }: PreUpdateStatusParams): Promise<void> {
        switch (newStatus) {
            case FlowStatus.ENABLED: {
                await triggerService(log).enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                })
                break
            }
            case FlowStatus.DISABLED: {
                await triggerService(log).disable({
                    flowId: publishedFlowVersion.flowId,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    ignoreError: false,
                })
                break
            }
        }
    },

    async preDelete({ flowToDelete }: PreDeleteParams): Promise<void> {
        if (
            flowToDelete.status === FlowStatus.DISABLED ||
            isNil(flowToDelete.publishedVersionId)
        ) {
            return
        }
        await triggerService(log).disable({
            flowId: flowToDelete.id,
            projectId: flowToDelete.projectId,
            simulate: false,
            ignoreError: true,
        })

        await sampleDataService(log).deleteForFlow({
            projectId: flowToDelete.projectId,
            flowId: flowToDelete.id,
            fileType: FileType.SAMPLE_DATA,
        })

        await sampleDataService(log).deleteForFlow({
            projectId: flowToDelete.projectId,
            flowId: flowToDelete.id,
            fileType: FileType.SAMPLE_DATA_INPUT,
        })
    },
})

type PreUpdateStatusParams = {
    flowToUpdate: Flow
    publishedFlowVersion: FlowVersion
    newStatus: FlowStatus
}


type PreDeleteParams = {
    flowToDelete: Flow
}
