import { tryCatchSync } from '@activepieces/core-utils'
import { FlowOperationRequest, FlowOperationType, FlowStatus, FlowVersion, WebsocketClientEvent } from '@activepieces/shared'
import { websocketService } from '../core/websockets.service'

export const flowRealtime = {
    versionUpdated({ projectId, flowVersion, operation }: VersionUpdatedParams): void {
        // Best-effort broadcast to the project room: a socket/startup hiccup must
        // never break the flow mutation. Any open builder for this flow patches its
        // canvas live (gated on the AI lock) instead of waiting for unlock.
        tryCatchSync(() => websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_VERSION_UPDATED, {
            projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            operationType: operation.type,
            changedStepNames: deriveChangedStepNames(operation),
            flowVersion,
        }))
    },
    flowUpdated({ projectId, flowId, status, publishedVersionId, folderId }: FlowUpdatedParams): void {
        // Flow-entity changes (status / publish / folder) bypass the version service,
        // so they need their own best-effort broadcast for an open builder to reflect
        // publish/enable/disable live without a refresh.
        tryCatchSync(() => websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_UPDATED, {
            projectId,
            flowId,
            status,
            publishedVersionId,
            folderId,
        }))
    },
}

const deriveChangedStepNames = (operation: FlowOperationRequest): string[] => {
    switch (operation.type) {
        case FlowOperationType.ADD_ACTION:
            return [operation.request.action.name]
        case FlowOperationType.UPDATE_ACTION:
        case FlowOperationType.MOVE_ACTION:
            return [operation.request.name]
        case FlowOperationType.UPDATE_TRIGGER:
            return [operation.request.name]
        case FlowOperationType.DELETE_ACTION:
        case FlowOperationType.SET_SKIP_ACTION:
            return operation.request.names
        case FlowOperationType.DUPLICATE_ACTION:
            return [operation.request.stepName]
        case FlowOperationType.ADD_BRANCH:
        case FlowOperationType.DELETE_BRANCH:
        case FlowOperationType.MOVE_BRANCH:
        case FlowOperationType.DUPLICATE_BRANCH:
            return [operation.request.stepName]
        default:
            return []
    }
}

type VersionUpdatedParams = {
    projectId: string
    flowVersion: FlowVersion
    operation: FlowOperationRequest
}

type FlowUpdatedParams = {
    projectId: string
    flowId: string
    status: FlowStatus
    publishedVersionId: string | null
    folderId: string | null
}
