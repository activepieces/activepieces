import { Flow, FlowScheduleOptions, FlowStatus, FlowVersion, ScheduleOptions, ScheduleType, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { flowVersionService } from '../flow-version/flow-version.service'
import { triggerUtils } from '../../helper/trigger-utils'

export const flowServiceHooks = {
    async preUpdateStatus({ flowToUpdate, newStatus }: PreUpdateStatusParams): Promise<PreUpdateReturn> {
        assertNotNullOrUndefined(flowToUpdate.publishedVersionId, 'publishedVersionId')

        const publishedFlowVersion = await flowVersionService.getFlowVersionOrThrow({
            flowId: flowToUpdate.id,
            versionId: flowToUpdate.publishedVersionId,
        })

        let scheduleOptions: ScheduleOptions | undefined

        switch (newStatus) {
            case FlowStatus.ENABLED: {
                const response = await triggerUtils.enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                })
                scheduleOptions = response?.result.scheduleOptions
                break
            }
            case FlowStatus.DISABLED: {
                await triggerUtils.disable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                })
                break
            }
        }

        if (isNil(scheduleOptions)) {
            return {
                scheduleOptions: null,
            }
        }

        return {
            scheduleOptions: {
                ...scheduleOptions,
                type: ScheduleType.CRON_EXPRESSION,
            },
        }
    },

    async preUpdatePublishedVersionId({ flowToUpdate, flowVersionToPublish }: PreUpdatePublishedVersionIdParams): Promise<PreUpdateReturn> {
        if (flowToUpdate.status === FlowStatus.ENABLED && flowToUpdate.publishedVersionId) {
            await triggerUtils.disable({
                flowVersion: await flowVersionService.getOneOrThrow(flowToUpdate.publishedVersionId),
                projectId: flowToUpdate.projectId,
                simulate: false,
            })
        }

        const enableResult = await triggerUtils.enable({
            flowVersion: flowVersionToPublish,
            projectId: flowToUpdate.projectId,
            simulate: false,
        })

        const scheduleOptions = enableResult?.result.scheduleOptions

        if (isNil(scheduleOptions)) {
            return {
                scheduleOptions: null,
            }
        }

        return {
            scheduleOptions: {
                ...scheduleOptions,
                type: ScheduleType.CRON_EXPRESSION,
            },
        }
    },

    async preDelete({ flowToDelete }: PreDeleteParams): Promise<void> {
        if (flowToDelete.status === FlowStatus.DISABLED || isNil(flowToDelete.publishedVersionId)) {
            return
        }

        const publishedFlowVersion = await flowVersionService.getFlowVersionOrThrow({
            flowId: flowToDelete.id,
            versionId: flowToDelete.publishedVersionId,
        })

        await triggerUtils.disable({
            flowVersion: publishedFlowVersion,
            projectId: flowToDelete.projectId,
            simulate: false,
        })
    },
}

type PreUpdateParams = {
    flowToUpdate: Flow
}

type PreUpdateStatusParams = PreUpdateParams & {
    newStatus: FlowStatus
}

type PreUpdatePublishedVersionIdParams = PreUpdateParams & {
    flowVersionToPublish: FlowVersion
}

type PreUpdateReturn = {
    scheduleOptions: FlowScheduleOptions | null
}

type PreDeleteParams = {
    flowToDelete: Flow
}
