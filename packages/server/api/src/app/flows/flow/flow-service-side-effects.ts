import {
    FileType,
    Flow,
    FlowStatus,
    FlowVersion,
    isNil,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { functionProvisioningService } from '../../workers/function-provisioning/function-provisioning.service'
import { sampleDataService } from '../step-run/sample-data.service'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        newStatus,
        flowToUpdate,
        publishedFlowVersion,
        templateId,
    }: PreUpdateStatusParams): Promise<void> {
        switch (newStatus) {
            case FlowStatus.ENABLED: {
                await triggerSourceService(log).enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    templateId,
                })
                // When the project's flows run on per-project Cloud Functions, publishing must
                // re-bake the function image with the new pieces/code. Fire-and-forget so the
                // publish call isn't blocked on a cloud build; the run path falls back to the
                // existing function until the rebuild lands.
                if (cloudFunctionsEnabled()) {
                    rejectedPromiseHandler(
                        functionProvisioningService(log).rebuild({ projectId: flowToUpdate.projectId }),
                        log,
                    )
                }
                break
            }
            case FlowStatus.DISABLED: {
                await triggerSourceService(log).disable({
                    flowId: publishedFlowVersion.flowId,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    ignoreError: false,
                    templateId,
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
        await triggerSourceService(log).disable({
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

function cloudFunctionsEnabled(): boolean {
    return !isNil(system.get(AppSystemProp.FUNCTION_GCP_PROJECT))
}

type PreUpdateStatusParams = {
    flowToUpdate: Flow
    publishedFlowVersion: FlowVersion
    newStatus: FlowStatus
    templateId?: string
}


type PreDeleteParams = {
    flowToDelete: Flow
}
