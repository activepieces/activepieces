import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { FlowRetryStrategy } from './flow-run'

export const TestFlowRunRequestBody = Type.Object({
    flowVersionId: ApId,
})

export type TestFlowRunRequestBody = Static<typeof TestFlowRunRequestBody>

export const RetryFlowRequestBody = Type.Object({
    strategy: Type.Enum(FlowRetryStrategy),
})

export type RetryFlowRequestBody = Static<typeof RetryFlowRequestBody>