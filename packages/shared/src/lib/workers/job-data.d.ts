import { Static } from '@sinclair/typebox';
import { ProgressUpdateType, TriggerHookType } from '../engine';
import { ExecutionType } from '../flow-run/execution/execution-output';
import { RunEnvironment } from '../flow-run/flow-run';
import { FlowTriggerType } from '../flows/triggers/trigger';
export declare const LATEST_JOB_DATA_SCHEMA_VERSION = 4;
export declare const JOB_PRIORITY: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    veryLow: number;
    lowest: number;
};
export declare const RATE_LIMIT_PRIORITY: keyof typeof JOB_PRIORITY;
export declare function getDefaultJobPriority(job: JobData): keyof typeof JOB_PRIORITY;
export declare enum WorkerJobType {
    RENEW_WEBHOOK = "RENEW_WEBHOOK",
    EXECUTE_POLLING = "EXECUTE_POLLING",
    EXECUTE_WEBHOOK = "EXECUTE_WEBHOOK",
    EXECUTE_FLOW = "EXECUTE_FLOW",
    EXECUTE_VALIDATION = "EXECUTE_VALIDATION",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_EXTRACT_PIECE_INFORMATION = "EXECUTE_EXTRACT_PIECE_INFORMATION"
}
export declare const NON_SCHEDULED_JOB_TYPES: WorkerJobType[];
export declare const RenewWebhookJobData: import("@sinclair/typebox").TObject<{
    schemaVersion: import("@sinclair/typebox").TNumber;
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.RENEW_WEBHOOK>;
}>;
export type RenewWebhookJobData = Static<typeof RenewWebhookJobData>;
export declare const PollingJobData: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowVersionId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    triggerType: import("@sinclair/typebox").TEnum<typeof FlowTriggerType>;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_POLLING>;
}>;
export type PollingJobData = Static<typeof PollingJobData>;
export declare const ExecuteFlowJobData: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_FLOW>;
    environment: import("@sinclair/typebox").TEnum<typeof RunEnvironment>;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    runId: import("@sinclair/typebox").TString;
    synchronousHandlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
    httpRequestId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    payload: import("@sinclair/typebox").TAny;
    executeTrigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    executionType: import("@sinclair/typebox").TEnum<typeof ExecutionType>;
    progressUpdateType: import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>;
    stepNameToTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    logsUploadUrl: import("@sinclair/typebox").TString;
    logsFileId: import("@sinclair/typebox").TString;
    traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>;
export type ExecuteFlowJobData = Static<typeof ExecuteFlowJobData>;
export declare const WebhookJobData: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    requestId: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TAny;
    runEnvironment: import("@sinclair/typebox").TEnum<typeof RunEnvironment>;
    flowId: import("@sinclair/typebox").TString;
    saveSampleData: import("@sinclair/typebox").TBoolean;
    flowVersionIdToRun: import("@sinclair/typebox").TString;
    execute: import("@sinclair/typebox").TBoolean;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_WEBHOOK>;
    parentRunId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failParentOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>;
export type WebhookJobData = Static<typeof WebhookJobData>;
export declare const ExecuteValidateAuthJobData: import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_VALIDATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    schemaVersion: import("@sinclair/typebox").TNumber;
    connectionValue: import("@sinclair/typebox").TUnknown;
}>;
export type ExecuteValidateAuthJobData = Static<typeof ExecuteValidateAuthJobData>;
export declare const ExecuteTriggerHookJobData: import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_TRIGGER_HOOK>;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    test: import("@sinclair/typebox").TBoolean;
    webserverId: import("@sinclair/typebox").TString;
    hookType: import("@sinclair/typebox").TEnum<typeof TriggerHookType>;
    triggerPayload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        body: import("@sinclair/typebox").TUnknown;
        rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>>;
}>;
export type ExecuteTriggerHookJobData = Static<typeof ExecuteTriggerHookJobData>;
export declare const ExecutePropertyJobData: import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_PROPERTY>;
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
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
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
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
        state: import("@sinclair/typebox").TEnum<typeof import("../flows/flow-version").FlowVersionState>;
        connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: string;
        }>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>>;
    propertyName: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    actionOrTriggerName: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    webserverId: import("@sinclair/typebox").TString;
    sampleData: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ExecutePropertyJobData = Static<typeof ExecutePropertyJobData>;
export declare const ExecuteExtractPieceMetadataJobData: import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
}>;
export type ExecuteExtractPieceMetadataJobData = Static<typeof ExecuteExtractPieceMetadataJobData>;
export declare const UserInteractionJobData: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_VALIDATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    schemaVersion: import("@sinclair/typebox").TNumber;
    connectionValue: import("@sinclair/typebox").TUnknown;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_TRIGGER_HOOK>;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    test: import("@sinclair/typebox").TBoolean;
    webserverId: import("@sinclair/typebox").TString;
    hookType: import("@sinclair/typebox").TEnum<typeof TriggerHookType>;
    triggerPayload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        body: import("@sinclair/typebox").TUnknown;
        rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>>;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_PROPERTY>;
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
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
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
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
        state: import("@sinclair/typebox").TEnum<typeof import("../flows/flow-version").FlowVersionState>;
        connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: string;
        }>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>>;
    propertyName: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    actionOrTriggerName: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    webserverId: import("@sinclair/typebox").TString;
    sampleData: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
}>]>;
export type UserInteractionJobData = Static<typeof UserInteractionJobData>;
export declare const UserInteractionJobDataWithoutWatchingInformation: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_VALIDATION>;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    connectionValue: import("@sinclair/typebox").TUnknown;
}>, import("@sinclair/typebox").TObject<{
    test: import("@sinclair/typebox").TBoolean;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_TRIGGER_HOOK>;
    hookType: import("@sinclair/typebox").TEnum<typeof TriggerHookType>;
    triggerPayload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        body: import("@sinclair/typebox").TUnknown;
        rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>>;
}>, import("@sinclair/typebox").TObject<{
    propertyName: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    actionOrTriggerName: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sampleData: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
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
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
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
        state: import("@sinclair/typebox").TEnum<typeof import("../flows/flow-version").FlowVersionState>;
        connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: string;
        }>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>>;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_PROPERTY>;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
}>, import("@sinclair/typebox").TObject<{
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION>;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
}>]>;
export type UserInteractionJobDataWithoutWatchingInformation = Static<typeof UserInteractionJobDataWithoutWatchingInformation>;
export declare const JobData: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowVersionId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    triggerType: import("@sinclair/typebox").TEnum<typeof FlowTriggerType>;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_POLLING>;
}>, import("@sinclair/typebox").TObject<{
    schemaVersion: import("@sinclair/typebox").TNumber;
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.RENEW_WEBHOOK>;
}>, import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_FLOW>;
    environment: import("@sinclair/typebox").TEnum<typeof RunEnvironment>;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    runId: import("@sinclair/typebox").TString;
    synchronousHandlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
    httpRequestId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    payload: import("@sinclair/typebox").TAny;
    executeTrigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    executionType: import("@sinclair/typebox").TEnum<typeof ExecutionType>;
    progressUpdateType: import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>;
    stepNameToTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    logsUploadUrl: import("@sinclair/typebox").TString;
    logsFileId: import("@sinclair/typebox").TString;
    traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>, import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    requestId: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TAny;
    runEnvironment: import("@sinclair/typebox").TEnum<typeof RunEnvironment>;
    flowId: import("@sinclair/typebox").TString;
    saveSampleData: import("@sinclair/typebox").TBoolean;
    flowVersionIdToRun: import("@sinclair/typebox").TString;
    execute: import("@sinclair/typebox").TBoolean;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_WEBHOOK>;
    parentRunId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failParentOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_VALIDATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    schemaVersion: import("@sinclair/typebox").TNumber;
    connectionValue: import("@sinclair/typebox").TUnknown;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_TRIGGER_HOOK>;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    test: import("@sinclair/typebox").TBoolean;
    webserverId: import("@sinclair/typebox").TString;
    hookType: import("@sinclair/typebox").TEnum<typeof TriggerHookType>;
    triggerPayload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        body: import("@sinclair/typebox").TUnknown;
        rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>>;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_PROPERTY>;
    projectId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
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
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
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
        state: import("@sinclair/typebox").TEnum<typeof import("../flows/flow-version").FlowVersionState>;
        connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: string;
        }>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>>;
    propertyName: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
    actionOrTriggerName: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    webserverId: import("@sinclair/typebox").TString;
    sampleData: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    requestId: import("@sinclair/typebox").TString;
    webserverId: import("@sinclair/typebox").TString;
    schemaVersion: import("@sinclair/typebox").TNumber;
    jobType: import("@sinclair/typebox").TLiteral<WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.ARCHIVE>;
        pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces/piece").PieceType>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        archiveId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.OFFICIAL>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        packageType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PackageType.REGISTRY>;
        pieceType: import("@sinclair/typebox").TLiteral<import("../pieces/piece").PieceType.CUSTOM>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
    }>]>;
}>]>]>;
export type JobData = Static<typeof JobData>;
