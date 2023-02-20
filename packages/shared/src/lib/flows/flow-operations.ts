import {
    CodeAction, LoopOnItemsAction, PieceAction,
} from "./actions/action";
import { EmptyTrigger, PieceTrigger, ScheduleTrigger, WebhookTrigger } from "./triggers/trigger";
import { Static, Type } from "@sinclair/typebox";


export enum FlowOperationType {
    CHANGE_NAME = "CHANGE_NAME",
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION",
    DELETE_ACTION = "DELETE_ACTION",
    IMPORT_FLOW = "IMPORT_FLOW"
}

export const ImportFlowRequest = Type.Object({
    displayName: Type.String({}),
    trigger: Type.Any({}),
});

export type ImportFlowRequest = Static<typeof ImportFlowRequest>;


export const ChangeNameRequest = Type.Object({
    displayName: Type.String({}),
});

export type ChangeNameRequest = Static<typeof ChangeNameRequest>;

export const DeleteActionRequest = Type.Object({
    name: Type.String()
})

export type DeleteActionRequest = Static<typeof DeleteActionRequest>;


export const UpdateActionRequest = Type.Union([CodeAction, LoopOnItemsAction, PieceAction]);
export type UpdateActionRequest = Static<typeof UpdateActionRequest>;

export const AddActionRequest = Type.Object({
    parentAction: Type.Optional(Type.String()),
    action: UpdateActionRequest
})
export type AddActionRequest = Static<typeof AddActionRequest>;

export const UpdateScheduleTrigger = Type.Object({
    ...ScheduleTrigger.properties,
    settings: Type.Object({
        cronExpression: Type.String()
    })
});
export type UpdateScheduleTrigger = Static<typeof UpdateScheduleTrigger>;

export const UpdateTriggerRequest = Type.Union([EmptyTrigger, UpdateScheduleTrigger, PieceTrigger, WebhookTrigger]);
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>;

export const FlowOperationRequest = Type.Union([
    Type.Object({
        type: Type.Literal(FlowOperationType.IMPORT_FLOW),
        request: ImportFlowRequest
    }),
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
        request: UpdateActionRequest
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.ADD_ACTION),
        request: AddActionRequest
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: UpdateTriggerRequest
    })
]);

export type FlowOperationRequest = Static<typeof FlowOperationRequest>;