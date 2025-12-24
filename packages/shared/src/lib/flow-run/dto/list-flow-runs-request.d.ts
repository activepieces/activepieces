import { Static } from '@sinclair/typebox';
import { FlowRunStatus } from '../execution/flow-execution';
export declare const ListFlowRunsRequestQuery: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof FlowRunStatus>>>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdAfter: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdBefore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TString;
    failedStepName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    flowRunIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    archived: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export type ListFlowRunsRequestQuery = Static<typeof ListFlowRunsRequestQuery>;
