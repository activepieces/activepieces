import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
import { ExecutionState } from './execution/execution-output';
import { FlowRunStatus } from './execution/flow-execution';
export declare const PARENT_RUN_ID_HEADER = "ap-parent-run-id";
export declare const FAIL_PARENT_ON_FAILURE_HEADER = "ap-fail-parent-on-failure";
export type FlowRunId = ApId;
export declare enum RunEnvironment {
    PRODUCTION = "PRODUCTION",
    TESTING = "TESTING"
}
export declare enum FlowRetryStrategy {
    ON_LATEST_VERSION = "ON_LATEST_VERSION",
    FROM_FAILED_STEP = "FROM_FAILED_STEP"
}
export type FlowRetryPayload = {
    strategy: FlowRetryStrategy;
};
export declare const FlowRun: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    parentRunId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failParentOnFailure: import("@sinclair/typebox").TBoolean;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    flowVersionId: import("@sinclair/typebox").TString;
    flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    logsFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    status: import("@sinclair/typebox").TEnum<typeof FlowRunStatus>;
    startTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    finishTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    environment: import("@sinclair/typebox").TEnum<typeof RunEnvironment>;
    pauseMetadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("./execution/flow-execution").PauseType.DELAY>;
        resumeDateTime: import("@sinclair/typebox").TString;
        requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof import("../engine").ProgressUpdateType>>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("./execution/flow-execution").PauseType.WEBHOOK>;
        requestId: import("@sinclair/typebox").TString;
        requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        response: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
            headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        }>;
        handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof import("../engine").ProgressUpdateType>>;
    }>]>>;
    steps: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    failedStep: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
    }>>;
    stepNameToTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    archivedAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    stepsCount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export declare const FailedStep: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
}>;
export type FailedStep = Static<typeof FailedStep>;
export type FlowRun = Static<typeof FlowRun> & ExecutionState;
