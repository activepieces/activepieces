import { Static } from '@sinclair/typebox';
export declare const TASK_COMPLETION_TOOL_NAME = "updateTaskStatus";
export declare enum AgentToolType {
    PIECE = "PIECE",
    FLOW = "FLOW"
}
export declare const AgentPieceToolMetadata: import("@sinclair/typebox").TObject<{
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    actionName: import("@sinclair/typebox").TString;
    predefinedInput: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
}>;
export type AgentPieceToolMetadata = Static<typeof AgentPieceToolMetadata>;
export declare const AgentPieceTool: import("@sinclair/typebox").TObject<{
    pieceMetadata: import("@sinclair/typebox").TObject<{
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TString;
        predefinedInput: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    }>;
    toolName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<AgentToolType.PIECE>;
}>;
export type AgentPieceTool = Static<typeof AgentPieceTool>;
export declare const AgentFlowTool: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    toolName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<AgentToolType.FLOW>;
}>;
export type AgentFlowTool = Static<typeof AgentFlowTool>;
export declare const AgentTool: import("../common").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    pieceMetadata: import("@sinclair/typebox").TObject<{
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TString;
        predefinedInput: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    }>;
    toolName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<AgentToolType.PIECE>;
}>, import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    toolName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<AgentToolType.FLOW>;
}>]>;
export type AgentTool = Static<typeof AgentTool>;
