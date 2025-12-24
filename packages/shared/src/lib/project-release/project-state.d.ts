import { Static } from '@sinclair/typebox';
import { TableAutomationStatus, TableAutomationTrigger } from '../tables';
export declare enum FlowProjectOperationType {
    UPDATE_FLOW = "UPDATE_FLOW",
    CREATE_FLOW = "CREATE_FLOW",
    DELETE_FLOW = "DELETE_FLOW"
}
export declare enum ConnectionOperationType {
    UPDATE_CONNECTION = "UPDATE_CONNECTION",
    CREATE_CONNECTION = "CREATE_CONNECTION"
}
export declare enum TableOperationType {
    UPDATE_TABLE = "UPDATE_TABLE",
    CREATE_TABLE = "CREATE_TABLE",
    DELETE_TABLE = "DELETE_TABLE"
}
export declare const FlowState: import("@sinclair/typebox").TObject<{
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
}>;
export type FlowState = Static<typeof FlowState>;
export declare const ConnectionState: import("@sinclair/typebox").TObject<{
    externalId: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
}>;
export type ConnectionState = Static<typeof ConnectionState>;
export declare const FieldState: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TString;
    data: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        options: {
            value: string;
        }[];
    }>>;
    externalId: import("@sinclair/typebox").TString;
}>;
export type FieldState = Static<typeof FieldState>;
export declare const TableState: import("@sinclair/typebox").TObject<{
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
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
    trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
}>;
export type TableState = Static<typeof TableState>;
export declare const ProjectState: import("@sinclair/typebox").TObject<{
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
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
        trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    }>>>;
}>;
export type ProjectState = Static<typeof ProjectState>;
export declare const ProjectOperation: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.UPDATE_FLOW>;
    newFlowState: import("@sinclair/typebox").TObject<{
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
    }>;
    flowState: import("@sinclair/typebox").TObject<{
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
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.CREATE_FLOW>;
    flowState: import("@sinclair/typebox").TObject<{
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
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.DELETE_FLOW>;
    flowState: import("@sinclair/typebox").TObject<{
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
    }>;
}>]>;
export type ProjectOperation = Static<typeof ProjectOperation>;
export declare const ConnectionOperation: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.UPDATE_CONNECTION>;
    newConnectionState: import("@sinclair/typebox").TObject<{
        externalId: import("@sinclair/typebox").TString;
        pieceName: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
    connectionState: import("@sinclair/typebox").TObject<{
        externalId: import("@sinclair/typebox").TString;
        pieceName: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.CREATE_CONNECTION>;
    connectionState: import("@sinclair/typebox").TObject<{
        externalId: import("@sinclair/typebox").TString;
        pieceName: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
}>]>;
export type ConnectionOperation = Static<typeof ConnectionOperation>;
export declare const TableOperation: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<TableOperationType.UPDATE_TABLE>;
    newTableState: import("@sinclair/typebox").TObject<{
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
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
        trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    }>;
    tableState: import("@sinclair/typebox").TObject<{
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
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
        trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<TableOperationType.CREATE_TABLE>;
    tableState: import("@sinclair/typebox").TObject<{
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
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
        trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<TableOperationType.DELETE_TABLE>;
    tableState: import("@sinclair/typebox").TObject<{
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
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
        trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    }>;
}>]>;
export type TableOperation = Static<typeof TableOperation>;
export declare const DiffState: import("@sinclair/typebox").TObject<{
    flows: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.UPDATE_FLOW>;
        newFlowState: import("@sinclair/typebox").TObject<{
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
        }>;
        flowState: import("@sinclair/typebox").TObject<{
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
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.CREATE_FLOW>;
        flowState: import("@sinclair/typebox").TObject<{
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
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.DELETE_FLOW>;
        flowState: import("@sinclair/typebox").TObject<{
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
        }>;
    }>]>>;
    connections: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.UPDATE_CONNECTION>;
        newConnectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
        connectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.CREATE_CONNECTION>;
        connectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>]>>;
    tables: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.UPDATE_TABLE>;
        newTableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.CREATE_TABLE>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.DELETE_TABLE>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>]>>;
}>;
export type DiffState = Static<typeof DiffState>;
export declare const FlowSyncError: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
}>;
export type FlowSyncError = Static<typeof FlowSyncError>;
export declare const FlowProjectOperation: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.CREATE_FLOW>;
    flow: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.UPDATE_FLOW>;
    flow: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
    targetFlow: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.DELETE_FLOW>;
    flow: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>;
}>]>;
export type FlowProjectOperation = Static<typeof FlowProjectOperation>;
export declare const ProjectSyncPlan: import("@sinclair/typebox").TObject<{
    flows: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.CREATE_FLOW>;
        flow: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.UPDATE_FLOW>;
        flow: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
        targetFlow: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowProjectOperationType.DELETE_FLOW>;
        flow: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>]>>;
    connections: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.UPDATE_CONNECTION>;
        newConnectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
        connectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<ConnectionOperationType.CREATE_CONNECTION>;
        connectionState: import("@sinclair/typebox").TObject<{
            externalId: import("@sinclair/typebox").TString;
            pieceName: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
        }>;
    }>]>>;
    tables: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.UPDATE_TABLE>;
        newTableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.CREATE_TABLE>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<TableOperationType.DELETE_TABLE>;
        tableState: import("@sinclair/typebox").TObject<{
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
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
            trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
        }>;
    }>]>>;
    errors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        message: import("@sinclair/typebox").TString;
    }>>;
}>;
export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>;
