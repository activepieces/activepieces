import { Static, Type } from '@sinclair/typebox'
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
    connectionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type AddMcpPieceRequestBody = Static<typeof AddMcpPieceRequestBody>

export const UpdateMcpPieceRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(McpPieceStatus)),
    connectionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type UpdateMcpPieceRequestBody = Static<typeof UpdateMcpPieceRequestBody>


