import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export type McpId = ApId;
export declare const MCP_TRIGGER_PIECE_NAME = "@activepieces/piece-mcp";
export declare enum McpServerStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED"
}
export declare const McpServer: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof McpServerStatus>;
    token: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export declare const PopulatedMcpServer: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof McpServerStatus>;
    token: import("@sinclair/typebox").TString;
    flows: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: unknown;
        }>>;
        externalId: import("@sinclair/typebox").TString;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
        projectId: import("@sinclair/typebox").TString;
        status: import("@sinclair/typebox").TEnum<typeof import("../flows/flow").FlowStatus>;
        folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        publishedVersionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        operationStatus: import("@sinclair/typebox").TEnum<typeof import("../flows/flow").FlowOperationStatus>;
        timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        version: import("@sinclair/typebox").TObject<{
            flowId: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
            trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.PIECE>;
                settings: import("@sinclair/typebox").TObject<{
                    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    }>>;
                    propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                        type: import("@sinclair/typebox").TEnum<typeof import("../flows").PropertyExecutionType>;
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
                type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.EMPTY>;
                settings: import("@sinclair/typebox").TAny;
                name: import("@sinclair/typebox").TString;
                valid: import("@sinclair/typebox").TBoolean;
                displayName: import("@sinclair/typebox").TString;
                nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>]>;
            updatedBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            valid: import("@sinclair/typebox").TBoolean;
            schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            agentIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            state: import("@sinclair/typebox").TEnum<typeof import("../..").FlowVersionState>;
            connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
                [x: string]: string;
            }>>;
            id: import("@sinclair/typebox").TString;
            created: import("@sinclair/typebox").TString;
            updated: import("@sinclair/typebox").TString;
        }>;
        triggerSource: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            schedule: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
                type: import("../trigger").TriggerSourceScheduleType.CRON_EXPRESSION;
                cronExpression: string;
                timezone: string;
            }>>;
        }>>;
    }>>;
}>;
export type PopulatedMcpServer = Static<typeof PopulatedMcpServer>;
export type McpServer = Static<typeof McpServer>;
export declare const UpdateMcpServerRequest: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TEnum<typeof McpServerStatus>;
}>;
export type UpdateMcpServerRequest = Static<typeof UpdateMcpServerRequest>;
