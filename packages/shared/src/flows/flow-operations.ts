import {
    ActionType, CodeActionSettings, LoopOnItemsActionSettings, PieceActionSettings, StorageActionSettings,
} from "./actions/action";
import { PieceTriggerSettings, ScheduleTriggerSettings, TriggerType } from "./triggers/trigger";
import { Static, Type } from "@sinclair/typebox";


export enum FlowOperationType {
    CHANGE_NAME = "CHANGE_NAME",
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION",
    DELETE_ACTION = "DELETE_ACTION"
}


export const ChangeNameRequest = Type.Object({
    displayName: Type.String({}),
});

export type ChangeNameRequest = Static<typeof ChangeNameRequest>;

export const DeleteActionRequest = Type.Object({
    name: Type.String()
})

export type DeleteActionRequest = Static<typeof DeleteActionRequest>;

export type AddActionRequest = {
    parentAction: string | undefined,
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
    valid?: boolean;
}

export type UpdateTriggerRequest = BasicTriggerRequest<TriggerType.WEBHOOK, {}>
    | BasicTriggerRequest<TriggerType.SCHEDULE, ScheduleTriggerSettings>
    | BasicTriggerRequest<TriggerType.EMPTY, {}>
    | BasicTriggerRequest<TriggerType.PIECE, PieceTriggerSettings>


interface BasicTriggerRequest<A, V> {
    type: A;
    settings: V;
    displayName: string;
    valid?: boolean;
}


export const FlowOperationRequest = Type.Union([
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_NAME),
        request: ChangeNameRequest
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.DELETE_ACTION),
        request: DeleteActionRequest
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_ACTION),
        request: Type.Any({})
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.ADD_ACTION),
        request: Type.Any({})
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: Type.Any({})
    })
]);

export type FlowOperationRequest = Static<typeof FlowOperationRequest>;