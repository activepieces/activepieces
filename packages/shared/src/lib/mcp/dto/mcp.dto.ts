import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../../common'
import { ApId } from '../../common/id-generator'
import { McpPieceStatus } from '../mcp'

export const ListMcpsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.Optional(Type.String({})),
})

export type ListMcpsRequest = Static<typeof ListMcpsRequest>
export const AddMcpPieceRequestBody = Type.Object({
    mcpId: ApId,
    pieceName: Type.String(),
    status: Type.Optional(Type.Enum(McpPieceStatus)),
    connectionId: Nullable(Type.String()),
})

export type AddMcpPieceRequestBody = Static<typeof AddMcpPieceRequestBody>

export const UpdateMcpPieceRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(McpPieceStatus)),
    connectionId: Nullable(Type.String()),
})

export type UpdateMcpPieceRequestBody = Static<typeof UpdateMcpPieceRequestBody>


export const ListMcpsRequestQuery = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String(),
})

export type ListMcpsRequestQuery = Static<typeof ListMcpsRequestQuery>



