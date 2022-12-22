import {FlowVersion} from "../model/flow-version";
import {
    AddActionRequest,
    FlowOperation,
    OperationRequest,
    UpdateActionRequest,
    UpdateTriggerRequest
} from "../dto/flow-operations";
import {Trigger, TriggerType} from "../model/trigger";
import {Action, ActionType, CodeAction, ComponentAction, LoopOnItemsAction, StorageAction} from "../model/action";

function apply(flowVersion: FlowVersion,
               operation: OperationRequest): FlowVersion {
    const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
    switch (operation.type) {
        case FlowOperation.ADD_ACTION:
            const addActionRequest =  operation.request;

            break;
        case FlowOperation.UPDATE_ACTION:

            break;
        case FlowOperation.UPDATE_TRIGGER:
            flowVersion.trigger = createTrigger(clonedVersion.trigger.name, clonedVersion.trigger.nextAction, operation.request);
            break;
    }
    return flowVersion;
}

function createAction(name: string, nextAction: Action | undefined, request: UpdateActionRequest): Action {
    const baseProperties = {
        displayName: request.displayName,
        name: name,
        valid: false,
        nextAction: nextAction
    };
    switch (request.type) {
        case ActionType.STORAGE:
            return {
                ...baseProperties,
                type: ActionType.STORAGE,
                settings: request.settings,
            } as StorageAction;
        case ActionType.LOOP_ON_ITEMS:
            return {
                ...baseProperties,
                type: ActionType.LOOP_ON_ITEMS,
                settings: request.settings,
            } as LoopOnItemsAction;
        case ActionType.COMPONENT:
            return {
                ...baseProperties,
                type: ActionType.COMPONENT,
                settings: request.settings,
            } as ComponentAction;
        case ActionType.CODE:
            return {
                ...baseProperties,
                type: ActionType.CODE,
                settings: request.settings,
            } as CodeAction;
    }
}

function createTrigger(name: string, nextAction: Action | undefined, request: UpdateTriggerRequest): Trigger {
    const baseProperties = {
        displayName: request.displayName,
        name: name,
        valid: false,
        nextAction: nextAction
    };
    switch (request.type) {
        case TriggerType.COLLECTION_ENABLED:
            return {
                ...baseProperties,
                type: TriggerType.COLLECTION_DISABLED,
                settings: request.settings,
            };
        case TriggerType.SCHEDULE:
            return {
                ...baseProperties,
                type: TriggerType.COLLECTION_DISABLED,
                settings: request.settings
            };
        case TriggerType.COMPONENT:
            return {
                ...baseProperties,
                type: TriggerType.COLLECTION_DISABLED,
                settings: request.settings
            };
        case TriggerType.WEBHOOK:
            return {
                ...baseProperties,
                type: TriggerType.COLLECTION_DISABLED,
                settings: request.settings
            };
        case TriggerType.COLLECTION_DISABLED:
            return {
                ...baseProperties,
                type: TriggerType.COLLECTION_DISABLED,
                settings: request.settings
            };
    }
}