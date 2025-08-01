import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../common/seek-page'
import { FlowStatus } from '../flow'
import { FlowVersionState } from '../flow-version'

export const ListFlowsRequest = Type.Object({
    folderId: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    status: Type.Optional(Type.Array(Type.Enum(FlowStatus))),
    projectId: Type.String({}),
    name: Type.Optional(Type.String({})),
    agentExternalIds: Type.Optional(Type.Array(Type.String({}))),
    versionState: Type.Optional(Type.Enum(FlowVersionState)),
    connectionExternalIds: Type.Optional(Type.Array(Type.String({}))),
    externalIds: Type.Optional(Type.Array(Type.String({}))),
})

export type ListFlowsRequest = Omit<Static<typeof ListFlowsRequest>, 'cursor'> & { cursor: Cursor | undefined }

export const GetFlowQueryParamsRequest = Type.Object({
    versionId: Type.Optional(Type.String({})),
})

export type GetFlowQueryParamsRequest = Static<typeof GetFlowQueryParamsRequest>

export const ListFlowVersionRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListFlowVersionRequest = Omit<Static<typeof ListFlowVersionRequest>, 'cursor'> & { cursor: Cursor | undefined }
