import {
    ActionType, CodeActionSettings, LoopOnItemsActionSettings, PieceActionSettings, StorageActionSettings,
} from "./actions/action";
import {PieceTriggerSettings, ScheduleTriggerSettings, TriggerType} from "./triggers/trigger";
import {Type} from "@sinclair/typebox";


export enum FlowOperationType {
    CHANGE_NAME = "CHANGE_NAME",
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION",
    DELETE_ACTION = "DELETE_ACTION"
}

export type FlowOperationRequest = BasicOperationRequest<FlowOperationType.UPDATE_TRIGGER, UpdateTriggerRequest>
    | BasicOperationRequest<FlowOperationType.ADD_ACTION, AddActionRequest>
    | BasicOperationRequest<FlowOperationType.UPDATE_ACTION, UpdateActionRequest>
    | BasicOperationRequest<FlowOperationType.CHANGE_NAME, ChangeNameRequest>
    | BasicOperationRequest<FlowOperationType.DELETE_ACTION, DeleteActionRequest>;


export const FlowOperationRequestSchema = Type.Union([
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_NAME),
        request: Type.Object({
            displayName: Type.String()
        })
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.DELETE_ACTION),
        request: Type.Object({
            name: Type.String()
        })
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: Type.Object({})
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.ADD_ACTION),
        request: Type.Object({})
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: Type.Object({})
    })
]);

export type ChangeNameRequest = {
    displayName: string;
}

export type DeleteActionRequest = {
    name: string
}

export type AddActionRequest = {
    parentAction: string,
    action: UpdateActionRequest
}

export type UpdateActionRequest = BasicActionStep<ActionType.STORAGE, StorageActionSettings>
    | BasicActionStep<ActionType.CODE, CodeActionSettings>
    | BasicActionStep<ActionType.LOOP_ON_ITEMS, LoopOnItemsActionSettings>
    | BasicActionStep<ActionType.PIECE, PieceActionSettings>;


interface BasicActionStep<A, V> {
    type: A;
    settings: V;
    name: string,
    displayName: string;
}

export type UpdateTriggerRequest = BasicTriggerRequest<TriggerType.WEBHOOK, {}>
    | BasicTriggerRequest<TriggerType.SCHEDULE, ScheduleTriggerSettings>
    | BasicTriggerRequest<TriggerType.EMPTY, {}>
    | BasicTriggerRequest<TriggerType.PIECE, PieceTriggerSettings>


interface BasicTriggerRequest<A, V> {
    type: A;
    settings: V;
    displayName: string;
}

interface BasicOperationRequest<T extends FlowOperationType, V> {
    type: T;
    request: V;
}
