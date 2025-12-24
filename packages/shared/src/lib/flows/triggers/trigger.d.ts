import { Static } from '@sinclair/typebox';
import { CodeActionSettings, LoopOnItemsActionSettings, PieceActionSettings, RouterActionSettings } from '../actions/action';
export declare const AUTHENTICATION_PROPERTY_NAME = "auth";
export declare const PieceTriggerSettings: import("@sinclair/typebox").TObject<{
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
        schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>>;
    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
}>;
export type PieceTriggerSettings = Static<typeof PieceTriggerSettings>;
export declare enum FlowTriggerType {
    EMPTY = "EMPTY",
    PIECE = "PIECE_TRIGGER"
}
export declare const EmptyTrigger: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
    settings: import("@sinclair/typebox").TAny;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export type EmptyTrigger = Static<typeof EmptyTrigger>;
export declare const PieceTrigger: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export type PieceTrigger = Static<typeof PieceTrigger>;
export declare const FlowTrigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
    settings: import("@sinclair/typebox").TAny;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>]>;
export type FlowTrigger = Static<typeof FlowTrigger>;
export type StepSettings = CodeActionSettings | PieceActionSettings | PieceTriggerSettings | RouterActionSettings | LoopOnItemsActionSettings;
