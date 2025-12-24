import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export type FlowVersionId = ApId;
export declare const LATEST_FLOW_SCHEMA_VERSION = "10";
export declare enum FlowVersionState {
    LOCKED = "LOCKED",
    DRAFT = "DRAFT"
}
export declare const FlowVersion: import("@sinclair/typebox").TObject<{
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
    state: import("@sinclair/typebox").TEnum<typeof FlowVersionState>;
    connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: string;
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type FlowVersion = Static<typeof FlowVersion>;
export declare const FlowVersionMetadata: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    state: import("@sinclair/typebox").TEnum<typeof FlowVersionState>;
    updatedBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    updatedByUser: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        externalId?: string;
        lastActiveDate?: string;
        id: string;
        created: string;
        updated: string;
        status: import("../user").UserStatus;
        email: string;
        platformRole: import("../user").PlatformRole;
        firstName: string;
        lastName: string;
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type FlowVersionMetadata = Static<typeof FlowVersionMetadata>;
