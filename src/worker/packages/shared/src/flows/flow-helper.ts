import {FlowVersion} from "./flow-version";
import {
    AddActionRequest, DeleteActionRequest,
    FlowOperationType,
    FlowOperationRequest,
    UpdateActionRequest,
    UpdateTriggerRequest
} from "./flow-operations";
import {Trigger, TriggerType} from "./triggers/trigger";
import {Action, ActionType, CodeAction, ComponentAction, LoopOnItemsAction, StorageAction} from "./actions/action";



function isValid(flowVersion: FlowVersion){
    let valid = false;
    let step : Action | Trigger | undefined = flowVersion.trigger;
    while(step !== undefined){
        valid = valid && step.valid;
        step = step.nextAction;
    }
    return valid;
}

function deleteAction(flowVersion: FlowVersion, request: DeleteActionRequest): void {
    let parentStep: Trigger | Action = flowVersion.trigger;
    while (parentStep.nextAction !== undefined && parentStep.nextAction.name !== request.name) {
        parentStep = parentStep.nextAction;
    }
    if (parentStep.nextAction !== undefined) {
        let stepToUpdate: Action = parentStep.nextAction;
        parentStep.nextAction = stepToUpdate.nextAction;
    }
}


export function getStep(flowVersion: FlowVersion, stepName: string): Action | Trigger | undefined {
    let currentStep: Trigger | Action | undefined = flowVersion.trigger;
    while (currentStep !== undefined && currentStep.name !== stepName) {
        currentStep = currentStep.nextAction;
    }
    return currentStep;
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

export const flowHelper = {
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion {
        const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
        switch (operation.type) {
            case FlowOperationType.CHANGE_NAME:
                flowVersion.displayName = operation.request.displayName;
                break;
            case FlowOperationType.DELETE_ACTION:
                deleteAction(flowVersion, operation.request);
                break;
            case FlowOperationType.ADD_ACTION:
                addAction(flowVersion, operation.request);
                break;
            case FlowOperationType.UPDATE_ACTION:
                updateAction(flowVersion, operation.request);
                break;
            case FlowOperationType.UPDATE_TRIGGER:
                flowVersion.trigger = createTrigger(clonedVersion.trigger.name, operation.request, clonedVersion.trigger.nextAction);
                break;
        }
        clonedVersion.valid = isValid(clonedVersion);
        return flowVersion;
    },
    getStep: getStep
}