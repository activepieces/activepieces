import { Static } from '@sinclair/typebox';
import { ProgressUpdateType } from '../../engine';
export declare enum FlowRunStatus {
    FAILED = "FAILED",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    PAUSED = "PAUSED",
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    SUCCEEDED = "SUCCEEDED",
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
    TIMEOUT = "TIMEOUT",
    CANCELED = "CANCELED"
}
export declare enum PauseType {
    DELAY = "DELAY",
    WEBHOOK = "WEBHOOK"
}
export declare const DelayPauseMetadata: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<PauseType.DELAY>;
    resumeDateTime: import("@sinclair/typebox").TString;
    requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
}>;
export type DelayPauseMetadata = Static<typeof DelayPauseMetadata>;
export declare const RespondResponse: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>;
export type RespondResponse = Static<typeof RespondResponse>;
export declare const StopResponse: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>;
export type StopResponse = Static<typeof StopResponse>;
export declare const WebhookPauseMetadata: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<PauseType.WEBHOOK>;
    requestId: import("@sinclair/typebox").TString;
    requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    response: import("@sinclair/typebox").TObject<{
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>;
    handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
}>;
export type WebhookPauseMetadata = Static<typeof WebhookPauseMetadata>;
export declare const PauseMetadata: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<PauseType.DELAY>;
    resumeDateTime: import("@sinclair/typebox").TString;
    requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<PauseType.WEBHOOK>;
    requestId: import("@sinclair/typebox").TString;
    requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    response: import("@sinclair/typebox").TObject<{
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
        headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>;
    handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
}>]>;
export type PauseMetadata = Static<typeof PauseMetadata>;
export declare const isFlowRunStateTerminal: ({ status, ignoreInternalError }: {
    status: FlowRunStatus;
    ignoreInternalError: boolean;
}) => boolean;
export declare const FAILED_STATES: FlowRunStatus[];
export declare const isFailedState: (status: FlowRunStatus) => boolean;
