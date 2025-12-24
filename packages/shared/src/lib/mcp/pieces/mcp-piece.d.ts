import { Static } from '@sinclair/typebox';
export declare enum McpPropertyType {
    TEXT = "Text",
    BOOLEAN = "Boolean",
    DATE = "Date",
    NUMBER = "Number",
    ARRAY = "Array",
    OBJECT = "Object"
}
export declare const McpProperty: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TString;
    required: import("@sinclair/typebox").TBoolean;
}>;
export type McpProperty = Static<typeof McpProperty>;
export declare const McpTrigger: import("@sinclair/typebox").TObject<{
    pieceName: import("@sinclair/typebox").TString;
    triggerName: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TObject<{
        toolName: import("@sinclair/typebox").TString;
        toolDescription: import("@sinclair/typebox").TString;
        inputSchema: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            type: import("@sinclair/typebox").TString;
            required: import("@sinclair/typebox").TBoolean;
        }>>;
        returnsResponse: import("@sinclair/typebox").TBoolean;
    }>;
}>;
export type McpTrigger = Static<typeof McpTrigger>;
