import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../common/id-generator'
import { FlowRunStatus } from '../execution/flow-execution'

export const ListFlowRunsRequestQuery = Type.Object({
    flowId: Type.Optional(Type.Array(ApId)),
    tags: Type.Optional(Type.Array(Type.String({}))),
    status: Type.Optional(Type.Array(Type.Enum(FlowRunStatus))),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    createdAfter: Type.Optional(Type.String({})),
    createdBefore: Type.Optional(Type.String({})),
    projectId: ApId,
    failedStepName: Type.Optional(Type.String({})),
    flowRunIds: Type.Optional(Type.Array(ApId)),
})

export type ListFlowRunsRequestQuery = Static<typeof ListFlowRunsRequestQuery>
