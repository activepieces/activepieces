import { FlowAction, FlowActionType, FlowState, FlowTrigger, FlowVersion, isNil } from '@activepieces/shared'

function cleanFlowState(flowState: FlowState): FlowState {
    return {
        id: flowState.id,
        created: flowState.created,
        updated: flowState.updated,
        projectId: flowState.projectId,
        externalId: flowState.externalId,
        ownerId: flowState.ownerId,
        folderId: flowState.folderId,
        status: flowState.status,
        publishedVersionId: flowState.publishedVersionId,
        metadata: flowState.metadata,
        operationStatus: flowState.operationStatus,
        timeSavedPerRun: flowState.timeSavedPerRun,
        templateId: flowState.templateId,
        version: cleanFlowVersion(flowState.version),
        triggerSource: flowState.triggerSource,
    }
}

function cleanFlowVersion(version: FlowVersion): FlowVersion {
    return {
        id: version.id,
        created: version.created,
        updated: version.updated,
        flowId: version.flowId,
        displayName: version.displayName,
        trigger: cleanTrigger(version.trigger),
        updatedBy: version.updatedBy,
        valid: version.valid,
        schemaVersion: version.schemaVersion,
        agentIds: version.agentIds,
        state: version.state,
        connectionIds: version.connectionIds,
        backupFiles: version.backupFiles,
        notes: version.notes,
    }
}

function cleanTrigger(trigger: FlowTrigger): FlowTrigger {
    return {
        name: trigger.name,
        valid: trigger.valid,
        displayName: trigger.displayName,
        lastUpdatedDate: trigger.lastUpdatedDate,
        type: trigger.type,
        settings: trigger.settings,
        nextAction: isNil(trigger.nextAction) ? undefined : cleanAction(trigger.nextAction as FlowAction),
    } as FlowTrigger
}

function cleanAction(action: FlowAction): FlowAction {
    const base = {
        name: action.name,
        valid: action.valid,
        displayName: action.displayName,
        skip: action.skip,
        lastUpdatedDate: action.lastUpdatedDate,
        type: action.type,
        settings: action.settings,
    }

    switch (action.type) {
        case FlowActionType.CODE:
        case FlowActionType.PIECE: {
            return {
                ...base,
                nextAction: isNil(action.nextAction) ? undefined : cleanAction(action.nextAction),
            } as FlowAction
        }
        case FlowActionType.LOOP_ON_ITEMS: {
            return {
                ...base,
                nextAction: isNil(action.nextAction) ? undefined : cleanAction(action.nextAction),
                firstLoopAction: isNil(action.firstLoopAction) ? undefined : cleanAction(action.firstLoopAction),
            } as FlowAction
        }
        case FlowActionType.ROUTER: {
            return {
                ...base,
                nextAction: isNil(action.nextAction) ? undefined : cleanAction(action.nextAction),
                children: action.children.map((child) => isNil(child) ? null : cleanAction(child)),
            } as FlowAction
        }
    }
}

export const cleanFlowStateUtil = {
    cleanFlowState,
}
