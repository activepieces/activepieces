import { FlowAction, FlowActionType, FlowState, FlowTrigger, FlowTriggerType, FlowVersion, isNil } from '@activepieces/shared'

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
    const nextAction = isNil(trigger.nextAction) ? undefined : cleanAction(trigger.nextAction)
    const commonProps = {
        name: trigger.name,
        valid: trigger.valid,
        displayName: trigger.displayName,
        lastUpdatedDate: trigger.lastUpdatedDate,
    }

    switch (trigger.type) {
        case FlowTriggerType.PIECE:
            return { ...commonProps, type: trigger.type, settings: trigger.settings, nextAction }
        case FlowTriggerType.EMPTY:
            return { ...commonProps, type: trigger.type, settings: trigger.settings, nextAction }
    }
}

function cleanAction(action: FlowAction): FlowAction {
    const nextAction = isNil(action.nextAction) ? undefined : cleanAction(action.nextAction)
    const commonProps = {
        name: action.name,
        valid: action.valid,
        displayName: action.displayName,
        skip: action.skip,
        lastUpdatedDate: action.lastUpdatedDate,
    }

    switch (action.type) {
        case FlowActionType.CODE:
            return { ...commonProps, type: action.type, settings: action.settings, nextAction }
        case FlowActionType.PIECE:
            return { ...commonProps, type: action.type, settings: action.settings, nextAction }
        case FlowActionType.LOOP_ON_ITEMS:
            return {
                ...commonProps, type: action.type, settings: action.settings, nextAction,
                firstLoopAction: isNil(action.firstLoopAction) ? undefined : cleanAction(action.firstLoopAction),
            }
        case FlowActionType.ROUTER:
            return {
                ...commonProps, type: action.type, settings: action.settings, nextAction,
                children: action.children.map((child) => isNil(child) ? null : cleanAction(child)),
            }
    }
}

export const cleanFlowStateUtil = {
    cleanFlowState,
}
