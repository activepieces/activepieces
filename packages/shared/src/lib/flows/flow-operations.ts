import { Action, MissingActionSchema } from "./actions/action";
import {
    CodeActionSchema, BranchActionSchema, LoopOnItemsActionSchema, PieceActionSchema,
} from "./actions/action";
import { EmptyTrigger, PieceTrigger, WebhookTrigger } from "./triggers/trigger";
import { Static, Type } from "@sinclair/typebox";


export enum FlowOperationType {
    CHANGE_FOLDER = "CHANGE_FOLDER",
    IMPORT_FLOW = 'IMPORT_FLOW',
    CHANGE_NAME = "CHANGE_NAME",
    GENERATE_FLOW = "GENERATE_FLOW",
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION",
    DELETE_ACTION = "DELETE_ACTION"
}

export enum StepLocationRelativeToParent {
    INSIDE_TRUE_BRANCH = "INSIDE_TRUE_BRANCH",
    INSIDE_FALSE_BRANCH = "INSIDE_FALSE_BRANCH",
    AFTER = "AFTER",
    INSIDE_LOOP = "INSIDE_LOOP"
}

export const ImportFlowRequest = Type.Object({
    displayName: Type.String({}),
    trigger: Type.Union([Type.Composite([WebhookTrigger, Type.Object({ nextAction: Action })]), Type.Composite([PieceTrigger, Type.Object({ nextAction: Action })])]),
})

export type ImportFlowRequest = Static<typeof ImportFlowRequest>;

export const ChangeFolderRequest = Type.Object({
    folderId: Type.Optional(Type.String({})),
});

export type ChangeFolderRequest = Static<typeof ChangeFolderRequest>;


export const GenerateFlowRequest = Type.Object({
    prompt: Type.String({}),
});

export type GenerateFlowRequest = Static<typeof GenerateFlowRequest>;


export const ChangeNameRequest = Type.Object({
    displayName: Type.String({}),
});

export type ChangeNameRequest = Static<typeof ChangeNameRequest>;

export const DeleteActionRequest = Type.Object({
    name: Type.String()
})

export type DeleteActionRequest = Static<typeof DeleteActionRequest>;

export const UpdateActionRequest = Type.Union([CodeActionSchema, LoopOnItemsActionSchema, PieceActionSchema, BranchActionSchema, MissingActionSchema]);
export type UpdateActionRequest = Static<typeof UpdateActionRequest>;

export const AddActionRequest = Type.Object({
    parentStep: Type.String(),
    stepLocationRelativeToParent: Type.Optional(Type.Enum(StepLocationRelativeToParent)),
    action: UpdateActionRequest
})
export type AddActionRequest = Static<typeof AddActionRequest>;

export const UpdateTriggerRequest = Type.Union([EmptyTrigger, PieceTrigger, WebhookTrigger]);
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>;

export const FlowOperationRequest = Type.Union([
    Type.Object({
        type: Type.Literal(FlowOperationType.GENERATE_FLOW),
        request: GenerateFlowRequest
    }),
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
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_FOLDER),
        request: ChangeFolderRequest
    })
]);

export type FlowOperationRequest = Static<typeof FlowOperationRequest>;