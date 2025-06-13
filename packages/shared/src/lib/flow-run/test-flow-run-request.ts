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

export const BulkRetryFlowRequestBody = Type.Object({
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

export type BulkRetryFlowRequestBody = Static<typeof BulkRetryFlowRequestBody>