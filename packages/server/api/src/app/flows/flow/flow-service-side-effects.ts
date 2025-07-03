import {
    FileType,
    Flow,
    FlowScheduleOptions,
    FlowStatus,
    FlowVersion,
    isNil,
    ScheduleOptions,
    ScheduleType,
    WebhookHandshakeConfiguration,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowVersionService } from '../flow-version/flow-version.service'
import { sampleDataService } from '../step-run/sample-data.service'
import { triggerHooks } from '../trigger'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        newStatus,
        flowToUpdate,
        publishedFlowVersion,
    }: PreUpdateStatusParams): Promise<PreUpdateReturn> {

        let scheduleOptions: ScheduleOptions | undefined
        const webhookHandshakeConfiguration: WebhookHandshakeConfiguration | null = flowToUpdate.handshakeConfiguration ?? null
        switch (newStatus) {
            case FlowStatus.ENABLED: {
                const response = await triggerHooks.enable(
                    {
                        flowVersion: publishedFlowVersion,
                        projectId: flowToUpdate.projectId,
                        simulate: false,
                    }, log)
                scheduleOptions = response?.result.scheduleOptions
                break
            }
            case FlowStatus.DISABLED: {
                await triggerHooks.disable(
                    {
                        flowVersion: publishedFlowVersion,
                        projectId: flowToUpdate.projectId,
                        simulate: false,
                    }, log)
                break
            }
        }

        if (isNil(scheduleOptions)) {
            return {
                scheduleOptions: null,
                webhookHandshakeConfiguration,
            }
        }

        return {
            scheduleOptions: {
                ...scheduleOptions,
                type: ScheduleType.CRON_EXPRESSION,
                failureCount: flowToUpdate.schedule?.failureCount ?? 0,
            },
            webhookHandshakeConfiguration,
        }
    },

    async preDelete({ flowToDelete }: PreDeleteParams): Promise<void> {
        if (
            flowToDelete.status === FlowStatus.DISABLED ||
            isNil(flowToDelete.publishedVersionId)
        ) {
            return
        }

        const publishedFlowVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: flowToDelete.id,
            versionId: flowToDelete.publishedVersionId,
        })

        await triggerHooks.disable(
            {
                flowVersion: publishedFlowVersion,
                projectId: flowToDelete.projectId,
                simulate: false,
            },
            log,
        )

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

type PreUpdateReturn = {
    scheduleOptions: FlowScheduleOptions | null
    webhookHandshakeConfiguration: WebhookHandshakeConfiguration | null
}

type PreDeleteParams = {
    flowToDelete: Flow
}
