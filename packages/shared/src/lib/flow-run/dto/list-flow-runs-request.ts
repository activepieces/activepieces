import { ApId } from '../../common/id-generator'
import { Cursor } from '../../common/seek-page'
import { Static, Type } from '@sinclair/typebox'
import { FlowRunStatus } from '../execution/flow-execution'

export const ListFlowRunsRequestQuery = Type.Object({
    flowId: Type.Optional(ApId),
    tags: Type.Optional(Type.Array(Type.String({}))),
    status: Type.Optional(Type.Enum(FlowRunStatus)),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    createdAfter: Type.Optional(Type.String({})),
    createdBefore: Type.Optional(Type.String({})),
    // TODO make this required after May 2024
    projectId: Type.Optional(ApId),
})

export type ListFlowRunsRequestQuery = Static<typeof ListFlowRunsRequestQuery> & { cursor: Cursor }
