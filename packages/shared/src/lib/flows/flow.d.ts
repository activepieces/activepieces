import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
import { WebhookHandshakeConfiguration } from '../trigger';
export type FlowId = ApId;
export declare enum FlowStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED"
}
export declare enum FlowOperationStatus {
    NONE = "NONE",
    DELETING = "DELETING",
    ENABLING = "ENABLING",
    DISABLING = "DISABLING"
}
export declare const flowExecutionStateKey: (flowId: FlowId) => string;
export type FlowExecutionState = {
    exists: false;
} | {
    exists: true;
    handshakeConfiguration: WebhookHandshakeConfiguration | undefined;
    flow: Flow;
    platformId: string;
};
export declare const Flow: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TString;
    folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    status: import("@sinclair/typebox").TEnum<typeof FlowStatus>;
    publishedVersionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    operationStatus: import("@sinclair/typebox").TEnum<typeof FlowOperationStatus>;
    timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Flow = Static<typeof Flow>;
export declare const PopulatedFlow: import("@sinclair/typebox").TObject<{
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    externalId: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof FlowStatus>;
    folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    publishedVersionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    operationStatus: import("@sinclair/typebox").TEnum<typeof FlowOperationStatus>;
    timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    version: import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("./triggers/trigger").FlowTriggerType.PIECE>;
            settings: import("@sinclair/typebox").TObject<{
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                    type: import("@sinclair/typebox").TEnum<typeof import("./properties").PropertyExecutionType>;
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
            type: import("@sinclair/typebox").TLiteral<import("./triggers/trigger").FlowTriggerType.EMPTY>;
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
        state: import("@sinclair/typebox").TEnum<typeof import("./flow-version").FlowVersionState>;
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
export type PopulatedFlow = Static<typeof PopulatedFlow>;
export declare const PopulatedTriggerSource: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof import("../trigger").TriggerStrategy>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    triggerName: import("@sinclair/typebox").TString;
    deleted: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    schedule: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        type: import("../trigger").TriggerSourceScheduleType.CRON_EXPRESSION;
        cronExpression: string;
        timezone: string;
    }>>;
    simulate: import("@sinclair/typebox").TBoolean;
    flow: import("@sinclair/typebox").TObject<{
        projectId: import("@sinclair/typebox").TString;
        externalId: import("@sinclair/typebox").TString;
        folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        status: import("@sinclair/typebox").TEnum<typeof FlowStatus>;
        publishedVersionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: unknown;
        }>>;
        operationStatus: import("@sinclair/typebox").TEnum<typeof FlowOperationStatus>;
        timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>;
}>;
export type PopulatedTriggerSource = Static<typeof PopulatedTriggerSource>;
