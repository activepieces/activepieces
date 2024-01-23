import { ApId } from '../../common/id-generator'
import { Cursor } from '../../common/seek-page'
import { Static, Type } from '@sinclair/typebox'
import { ExecutionOutputStatus } from '../execution/execution-output'

export const ListFlowRunsRequestQuery = Type.Object({
    flowId: Type.Optional(ApId),
    tags: Type.Optional(Type.Array(Type.String({}))),
    status: Type.Optional(Type.Enum(ExecutionOutputStatus)),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListFlowRunsRequestQuery = Static<typeof ListFlowRunsRequestQuery> & { cursor: Cursor }
