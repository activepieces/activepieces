import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { FlowRerunStrategy } from './flow-run'

export const TestFlowRunRequestBody = Type.Object({
    flowVersionId: ApId,
})

export type TestFlowRunRequestBody = Static<typeof TestFlowRunRequestBody>

export const RerunFlowRequestBody = Type.Object({
    strategy: Type.Enum(FlowRerunStrategy),
})

export type RerunFlowRequestBody = Static<typeof RerunFlowRequestBody>