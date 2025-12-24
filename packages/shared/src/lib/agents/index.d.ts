import { Static } from '@sinclair/typebox';
export * from './tools';
export declare enum AgentOutputFieldType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean"
}
export declare enum AgentTaskStatus {
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    IN_PROGRESS = "IN_PROGRESS"
}
export declare enum ContentBlockType {
    MARKDOWN = "MARKDOWN",
    TOOL_CALL = "TOOL_CALL"
}
export declare enum ToolCallStatus {
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed"
}
export declare enum ExecutionToolStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}
export declare enum ToolCallType {
    PIECE = "PIECE",
    FLOW = "FLOW"
}
export declare const AgentOutputField: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TEnum<typeof AgentOutputFieldType>;
}>;
export type AgentOutputField = Static<typeof AgentOutputField>;
export type AgentResult = {
    prompt: string;
    steps: AgentStepBlock[];
    status: AgentTaskStatus;
    structuredOutput?: unknown;
};
export declare enum AgentPieceProps {
    AGENT_TOOLS = "agentTools",
    STRUCTURED_OUTPUT = "structuredOutput",
    PROMPT = "prompt",
    MAX_STEPS = "maxSteps",
    AI_PROVIDER = "provider",
    AI_MODEL = "model"
}
export declare const MarkdownContentBlock: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.MARKDOWN>;
    markdown: import("@sinclair/typebox").TString;
}>;
export type MarkdownContentBlock = Static<typeof MarkdownContentBlock>;
declare const ToolCallBaseSchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.TOOL_CALL>;
    input: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    output: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    toolName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof ToolCallStatus>;
    toolCallId: import("@sinclair/typebox").TString;
    startTime: import("@sinclair/typebox").TString;
    endTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ToolCallBase = Static<typeof ToolCallBaseSchema>;
export declare const ToolCallContentBlock: import("../common").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    toolCallType: import("@sinclair/typebox").TLiteral<ToolCallType.PIECE>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    actionName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.TOOL_CALL>;
    input: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    output: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    toolName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof ToolCallStatus>;
    toolCallId: import("@sinclair/typebox").TString;
    startTime: import("@sinclair/typebox").TString;
    endTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    toolCallType: import("@sinclair/typebox").TLiteral<ToolCallType.FLOW>;
    displayName: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.TOOL_CALL>;
    input: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    output: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    toolName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof ToolCallStatus>;
    toolCallId: import("@sinclair/typebox").TString;
    startTime: import("@sinclair/typebox").TString;
    endTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>]>;
export type ToolCallContentBlock = Static<typeof ToolCallContentBlock>;
export declare const AgentStepBlock: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.MARKDOWN>;
    markdown: import("@sinclair/typebox").TString;
}>, import("../common").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    toolCallType: import("@sinclair/typebox").TLiteral<ToolCallType.PIECE>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    actionName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.TOOL_CALL>;
    input: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    output: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    toolName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof ToolCallStatus>;
    toolCallId: import("@sinclair/typebox").TString;
    startTime: import("@sinclair/typebox").TString;
    endTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    toolCallType: import("@sinclair/typebox").TLiteral<ToolCallType.FLOW>;
    displayName: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ContentBlockType.TOOL_CALL>;
    input: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    output: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    toolName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof ToolCallStatus>;
    toolCallId: import("@sinclair/typebox").TString;
    startTime: import("@sinclair/typebox").TString;
    endTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>]>]>;
export type AgentStepBlock = Static<typeof AgentStepBlock>;
