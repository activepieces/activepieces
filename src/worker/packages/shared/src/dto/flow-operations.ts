import {
    ActionType, CodeActionSettings, ComponentActionSettings, LoopOnItemsActionSettings, StorageActionSettings,
} from "../model/action";
import {ComponentTriggerSettings, ScheduleTriggerSettings, TriggerType} from "../model/trigger";


export enum FlowOperation {
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION"
}

export type OperationRequest = BasicOperationRequest<FlowOperation.UPDATE_TRIGGER, UpdateTriggerRequest>
    | BasicOperationRequest<FlowOperation.ADD_ACTION, AddActionRequest>
    | BasicOperationRequest<FlowOperation.UPDATE_ACTION, UpdateActionRequest>;


export type AddActionRequest = {
    parentAction: string,
    action: UpdateActionRequest
}

export type UpdateActionRequest = BasicStepRequest<ActionType.STORAGE, StorageActionSettings>
    | BasicStepRequest<ActionType.CODE, CodeActionSettings>
    | BasicStepRequest<ActionType.LOOP_ON_ITEMS, LoopOnItemsActionSettings>
    | BasicStepRequest<ActionType.COMPONENT, ComponentActionSettings>;

export type UpdateTriggerRequest = BasicStepRequest<TriggerType.WEBHOOK, {}>
    | BasicStepRequest<TriggerType.SCHEDULE, ScheduleTriggerSettings>
    | BasicStepRequest<TriggerType.COLLECTION_DISABLED, {}>
    | BasicStepRequest<TriggerType.COLLECTION_ENABLED, {}>
    | BasicStepRequest<TriggerType.COMPONENT, ComponentTriggerSettings>

interface BasicOperationRequest<T extends FlowOperation, V> {
    type: T;
    request: V;
}

interface BasicStepRequest<A, V> {
    type: A;
    settings: V;
    name: string,
    displayName: string;
}