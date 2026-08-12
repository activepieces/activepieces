import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, FileType, Flow, FlowOperationRequest, FlowOperationType, FlowStatus, FlowVersion, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents, MetaInformation } from '../../helper/application-events'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { sampleDataService } from '../step-run/sample-data.service'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        newStatus,
        flowToUpdate,
        publishedFlowVersion,
        templateId,
        isRepublish,
    }: PreUpdateStatusParams): Promise<void> {
        switch (newStatus) {
            case FlowStatus.ENABLED: {
                await triggerSourceService(log).enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    templateId,
                    isRepublish,
                })
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

    onCreated({ flow, ...meta }: OnCreatedParams): void {
        applicationEvents(log).sendUserEvent(meta, {
            action: ApplicationEventName.FLOW_CREATED,
            data: {
                flow,
            },
        })
    },

    onOperationApplied({ flow, previousVersion, previousStatus, operation, ...meta }: OnOperationAppliedParams): void {
        applicationEvents(log).sendUserEvent(meta, {
            action: ApplicationEventName.FLOW_UPDATED,
            data: {
                flow: {
                    id: flow.id,
                    externalId: flow.externalId,
                    created: flow.created,
                    updated: flow.updated,
                },
                request: operation,
                flowVersion: previousVersion,
            },
        })
        for (const action of pickLifecycleActions({ operation, previousStatus })) {
            applicationEvents(log).sendUserEvent(meta, {
                action,
                data: {
                    flow,
                    flowVersion: flow.version,
                },
            })
        }
    },

    onDeleted({ flow, ...meta }: OnDeletedParams): void {
        applicationEvents(log).sendUserEvent(meta, {
            action: ApplicationEventName.FLOW_DELETED,
            data: {
                flow,
                flowVersion: flow.version,
            },
        })
    },
})

function pickLifecycleActions({ operation, previousStatus }: PickLifecycleActionsParams): ApplicationEventName[] {
    if (operation.type === FlowOperationType.LOCK_AND_PUBLISH) {
        const newStatus = operation.request.status ?? FlowStatus.ENABLED
        const transitionAction = pickTransitionAction({ previousStatus, newStatus })
        return isNil(transitionAction)
            ? [ApplicationEventName.FLOW_PUBLISHED]
            : [ApplicationEventName.FLOW_PUBLISHED, transitionAction]
    }
    if (operation.type === FlowOperationType.CHANGE_STATUS) {
        const transitionAction = pickTransitionAction({ previousStatus, newStatus: operation.request.status })
        return isNil(transitionAction) ? [] : [transitionAction]
    }
    return []
}

function pickTransitionAction({ previousStatus, newStatus }: PickTransitionActionParams): ApplicationEventName | undefined {
    if (newStatus === previousStatus) {
        return undefined
    }
    return newStatus === FlowStatus.ENABLED
        ? ApplicationEventName.FLOW_ACTIVATED
        : ApplicationEventName.FLOW_DEACTIVATED
}

type PreUpdateStatusParams = {
    flowToUpdate: Flow
    publishedFlowVersion: FlowVersion
    newStatus: FlowStatus
    templateId?: string
    isRepublish?: boolean
}


type PreDeleteParams = {
    flowToDelete: Flow
}

type OnCreatedParams = MetaInformation & {
    flow: PopulatedFlow
}

type OnOperationAppliedParams = MetaInformation & {
    flow: PopulatedFlow
    previousVersion: FlowVersion
    previousStatus: FlowStatus
    operation: FlowOperationRequest
}

type OnDeletedParams = MetaInformation & {
    flow: PopulatedFlow
}

type PickLifecycleActionsParams = {
    operation: FlowOperationRequest
    previousStatus: FlowStatus
}

type PickTransitionActionParams = {
    previousStatus: FlowStatus
    newStatus: FlowStatus
}
