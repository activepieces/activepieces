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
            addAction(flowVersion, operation.request);
            break;
        case FlowOperation.UPDATE_ACTION:
            updateAction(flowVersion, operation.request);
            break;
        case FlowOperation.UPDATE_TRIGGER:
            flowVersion.trigger = createTrigger(clonedVersion.trigger.name, operation.request, clonedVersion.trigger.nextAction);
            break;
    }
    return flowVersion;
}

function updateAction(flowVersion: FlowVersion, request: UpdateActionRequest): void {
    let parentStep: Trigger | Action = flowVersion.trigger;
    while (parentStep.nextAction !== undefined && parentStep.nextAction.name !== request.name) {
        parentStep = parentStep.nextAction;
    }
    if (parentStep.nextAction !== undefined) {
        let stepToUpdate: Action = parentStep.nextAction;
        parentStep.nextAction = createAction(request, stepToUpdate.nextAction,);
    }
}


function addAction(flowVersion: FlowVersion, request: AddActionRequest): void {
    let currentStep: Trigger | Action = flowVersion.trigger;
    while (currentStep?.nextAction !== undefined && currentStep.name !== request.parentAction) {
        currentStep = currentStep.nextAction;
    }
    currentStep.nextAction = createAction(request.action, currentStep.nextAction);
}

function createAction(request: UpdateActionRequest, nextAction: Action | undefined): Action {
    const baseProperties = {
        displayName: request.displayName,
        name: request.name,
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

function createTrigger(name: string, request: UpdateTriggerRequest, nextAction: Action | undefined): Trigger {
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

export const FlowHelper = {
    apply: apply
}