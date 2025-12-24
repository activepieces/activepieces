import { Static } from '@sinclair/typebox';
export declare const Solution: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    state: import("@sinclair/typebox").TObject<{
        flows: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
                [x: string]: unknown;
            }>>;
            externalId: import("@sinclair/typebox").TString;
            id: import("@sinclair/typebox").TString;
            created: import("@sinclair/typebox").TString;
            updated: import("@sinclair/typebox").TString;
            projectId: import("@sinclair/typebox").TString;
            status: import("@sinclair/typebox").TEnum<typeof import("../flows").FlowStatus>;
            folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            publishedVersionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            operationStatus: import("@sinclair/typebox").TEnum<typeof import("../flows").FlowOperationStatus>;
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
        connections: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>>>;
        tables: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TString;
            externalId: import("@sinclair/typebox").TString;
            fields: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                name: import("@sinclair/typebox").TString;
                type: import("@sinclair/typebox").TString;
                data: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
                    options: {
                        value: string;
                    }[];
                }>>;
                externalId: import("@sinclair/typebox").TString;
            }>>;
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<import("../tables").TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<import("../tables").TableAutomationTrigger>>;
        }>>>;
    }>;
}>;
export type Solution = Static<typeof Solution>;
export declare const ExportRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ExportRequestBody = Static<typeof ExportRequestBody>;
