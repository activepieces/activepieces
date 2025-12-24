import { Static } from '@sinclair/typebox';
import { FlowRunStatus } from './execution/flow-execution';
import { FlowRetryStrategy } from './flow-run';
export declare const TestFlowRunRequestBody: import("@sinclair/typebox").TObject<{
    flowVersionId: import("@sinclair/typebox").TString;
}>;
export type TestFlowRunRequestBody = Static<typeof TestFlowRunRequestBody>;
export declare const RetryFlowRequestBody: import("@sinclair/typebox").TObject<{
    strategy: import("@sinclair/typebox").TEnum<typeof FlowRetryStrategy>;
    projectId: import("@sinclair/typebox").TString;
}>;
export type RetryFlowRequestBody = Static<typeof RetryFlowRequestBody>;
export declare const BulkActionOnRunsRequestBody: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    flowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    excludeFlowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    strategy: import("@sinclair/typebox").TEnum<typeof FlowRetryStrategy>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof FlowRunStatus>>>;
    flowId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    createdAfter: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdBefore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failedStepName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type BulkActionOnRunsRequestBody = Static<typeof BulkActionOnRunsRequestBody>;
export declare const BulkCancelFlowRequestBody: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    flowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    excludeFlowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<FlowRunStatus.PAUSED>, import("@sinclair/typebox").TLiteral<FlowRunStatus.QUEUED>]>>>;
    flowId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    createdAfter: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdBefore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type BulkCancelFlowRequestBody = Static<typeof BulkCancelFlowRequestBody>;
export declare const BulkArchiveActionOnRunsRequestBody: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    flowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    excludeFlowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof FlowRunStatus>>>;
    flowId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    createdAfter: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdBefore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failedStepName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type BulkArchiveActionOnRunsRequestBody = Static<typeof BulkArchiveActionOnRunsRequestBody>;
