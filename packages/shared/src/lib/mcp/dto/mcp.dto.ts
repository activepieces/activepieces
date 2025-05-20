import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../../common'
import { ApId } from '../../common/id-generator'

export const ListMcpsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.Optional(Type.String({})),
    name: Type.Optional(Type.String({})),
})

export type ListMcpsRequest = Static<typeof ListMcpsRequest>

export const ListMcpsRequestQuery = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String(),
    name: Type.Optional(Type.String({})),
})

export type ListMcpsRequestQuery = Static<typeof ListMcpsRequestQuery>


export const CreateMcpRequestBody = Type.Object({
    name: Type.String(),
})

export type CreateMcpRequestBody = Static<typeof CreateMcpRequestBody>

export const UpdateMcpRequestBody = Type.Object({
    name: Type.Optional(Type.String({})),
    token: Type.Optional(Type.String({})),
})

export type UpdateMcpRequestBody = Static<typeof UpdateMcpRequestBody>


export const UpdateMcpActionsRequestBody = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionNames: Type.Array(Type.String()),
    connectionId: Nullable(Type.String()),
})

export type UpdateMcpActionsRequestBody = Static<typeof UpdateMcpActionsRequestBody>


export const UpdateMcpFlowsRequestBody = Type.Object({
    flowIds: Type.Array(Type.String()),
})

export type UpdateMcpFlowsRequestBody = Static<typeof UpdateMcpFlowsRequestBody>






