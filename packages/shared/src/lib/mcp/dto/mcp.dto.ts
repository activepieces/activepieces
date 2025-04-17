import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../common/id-generator'
import { MCPPieceStatus } from '../mcp'

export const ListMCPsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.Optional(Type.String({})),
})

export type ListMCPsRequest = Static<typeof ListMCPsRequest>
export const AddMCPPieceRequestBody = Type.Object({
    mcpId: ApId,
    pieceName: Type.String(),
    status: Type.Optional(Type.Enum(MCPPieceStatus)),
    connectionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type AddMCPPieceRequestBody = Static<typeof AddMCPPieceRequestBody>

export const UpdateMCPPieceRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(MCPPieceStatus)),
    connectionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type UpdateMCPPieceRequestBody = Static<typeof UpdateMCPPieceRequestBody>


