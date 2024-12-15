import {
    assertNotNullOrUndefined,
    Flow,
    FlowScheduleOptions,
    FlowStatus,
    FlowVersion,
    isNil,
    ScheduleOptions,
    ScheduleType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { flowVersionService } from '../flow-version/flow-version.service'
import { sampleDataService } from '../step-run/sample-data.service'
import { triggerHooks } from '../trigger'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        flowToUpdate,
        newStatus,
        entityManager,
    }: PreUpdateStatusParams): Promise<PreUpdateReturn> {
        assertNotNullOrUndefined(
            flowToUpdate.publishedVersionId,
            'publishedVersionId',
        )

        const publishedFlowVersion = await flowVersionService(log).getFlowVersionOrThrow(
            {
                flowId: flowToUpdate.id,
                versionId: flowToUpdate.publishedVersionId,
                entityManager,
            },
        )

        let scheduleOptions: ScheduleOptions | undefined

        switch (newStatus) {
            case FlowStatus.ENABLED: {
                const response = await triggerHooks.enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                }, log)
                scheduleOptions = response?.result.scheduleOptions
                break
            }
            case FlowStatus.DISABLED: {
                await triggerHooks.disable({
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
            }
        }

        return {
            scheduleOptions: {
                ...scheduleOptions,
                type: ScheduleType.CRON_EXPRESSION,
                failureCount: flowToUpdate.schedule?.failureCount ?? 0,
            },
        }
    },

    async preUpdatePublishedVersionId({
        flowToUpdate,
        flowVersionToPublish,
    }: PreUpdatePublishedVersionIdParams): Promise<PreUpdateReturn> {
        if (
            flowToUpdate.status === FlowStatus.ENABLED &&
      flowToUpdate.publishedVersionId
        ) {
            await triggerHooks.disable({
                flowVersion: await flowVersionService(log).getOneOrThrow(
                    flowToUpdate.publishedVersionId,
                ),
                projectId: flowToUpdate.projectId,
                simulate: false,
            }, log)
        }

        const enableResult = await triggerHooks.enable({
            flowVersion: flowVersionToPublish,
            projectId: flowToUpdate.projectId,
            simulate: false,
        }, log)

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
                failureCount: 0,
            },
        }
    },

    async preDelete({ flowToDelete }: PreDeleteParams): Promise<void> {
        if (
            flowToDelete.status === FlowStatus.DISABLED ||
      isNil(flowToDelete.publishedVersionId)
        ) {
            return
        }

        const publishedFlowVersion = await flowVersionService(log).getFlowVersionOrThrow(
            {
                flowId: flowToDelete.id,
                versionId: flowToDelete.publishedVersionId,
            },
        )

        await triggerHooks.disable({
            flowVersion: publishedFlowVersion,
            projectId: flowToDelete.projectId,
            simulate: false,
        }, log)

        await sampleDataService(log).deleteForFlow({
            projectId: flowToDelete.projectId,
            flowId: flowToDelete.id,
        })
    },
})

type PreUpdateParams = {
    flowToUpdate: Flow
}

type PreUpdateStatusParams = PreUpdateParams & {
    newStatus: FlowStatus
    entityManager: EntityManager | undefined
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
