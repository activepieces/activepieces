import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { FlowRetryStrategy } from './flow-run'

export const FlowRunRequestBody = Type.Object({
    flowVersionId: ApId,
})

export type FlowRunRequestBody = Static<typeof FlowRunRequestBody>

export const RetryFlowRequestBody = Type.Object({
    strategy: Type.Enum(FlowRetryStrategy),
})

export type RetryFlowRequestBody = Static<typeof RetryFlowRequestBody>