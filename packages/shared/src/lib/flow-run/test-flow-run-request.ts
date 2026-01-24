import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { FlowRunStatus } from './execution/flow-execution'
import { FlowRetryStrategy } from './flow-run'

export const TestFlowRunRequestBody = Type.Object({
    flowVersionId: ApId,
})

export type TestFlowRunRequestBody = Static<typeof TestFlowRunRequestBody>

export const RetryFlowRequestBody = Type.Object({
    strategy: Type.Enum(FlowRetryStrategy),
    projectId: ApId,
})

export type RetryFlowRequestBody = Static<typeof RetryFlowRequestBody>


export const BulkActionOnRunsRequestBody = Type.Object({
    projectId: ApId,
    flowRunIds: Type.Optional(Type.Array(ApId)),
    excludeFlowRunIds: Type.Optional(Type.Array(ApId)),
    strategy: Type.Enum(FlowRetryStrategy),
    status: Type.Optional(Type.Array(Type.Enum(FlowRunStatus))),
    flowId: Type.Optional(Type.Array(ApId)),
    createdAfter: Type.Optional(Type.String()),
    createdBefore: Type.Optional(Type.String()),
    failedStepName: Type.Optional(Type.String()),
})

export type BulkActionOnRunsRequestBody = Static<typeof BulkActionOnRunsRequestBody>

export const BulkCancelFlowRequestBody = Type.Object({
    projectId: ApId,
    flowRunIds: Type.Optional(Type.Array(ApId)),
    excludeFlowRunIds: Type.Optional(Type.Array(ApId)),
    status: Type.Optional(Type.Array(Type.Union([
        Type.Literal(FlowRunStatus.PAUSED),
        Type.Literal(FlowRunStatus.QUEUED),
    ]))),
    flowId: Type.Optional(Type.Array(ApId)),
    createdAfter: Type.Optional(Type.String()),
    createdBefore: Type.Optional(Type.String()),
})

export type BulkCancelFlowRequestBody = Static<typeof BulkCancelFlowRequestBody>

export const BulkArchiveActionOnRunsRequestBody = Type.Object({
    projectId: ApId,
    flowRunIds: Type.Optional(Type.Array(ApId)),
    excludeFlowRunIds: Type.Optional(Type.Array(ApId)),
    status: Type.Optional(Type.Array(Type.Enum(FlowRunStatus))),
    flowId: Type.Optional(Type.Array(ApId)),
    createdAfter: Type.Optional(Type.String()),
    createdBefore: Type.Optional(Type.String()),
    failedStepName: Type.Optional(Type.String()),
})

export type BulkArchiveActionOnRunsRequestBody = Static<typeof BulkArchiveActionOnRunsRequestBody>
