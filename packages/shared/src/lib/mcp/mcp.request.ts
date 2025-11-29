import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common/base-model'
import { McpPieceToolData, McpToolType } from './tools/mcp-tool'
import { ApId } from '../common/id-generator'

export const ListMcpsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String({}),
    name: Type.Optional(Type.String({})),
})

export type ListMcpsRequest = Static<typeof ListMcpsRequest>


export const CreateMcpRequestBody = Type.Object({
    name: Type.String(),
    projectId: Type.String(),
})

export type CreateMcpRequestBody = Static<typeof CreateMcpRequestBody>

export const McpToolRequest = DiscriminatedUnion('type', [
    Type.Object({
        type: Type.Literal(McpToolType.PIECE),
        pieceMetadata: McpPieceToolData,
        toolName: Type.String(),
    }),
    Type.Object({
        type: Type.Literal(McpToolType.FLOW),
        flowId: Type.String(),
        toolName: Type.String(),
    }),
])
export type McpToolRequest = Static<typeof McpToolRequest>

export const UpdateMcpRequestParams = Type.Object({
    id: ApId,
})
export type UpdateMcpRequestParams = Static<typeof UpdateMcpRequestParams>

export const UpdateMcpRequestBody = Type.Object({
    name: Type.Optional(Type.String({})),
    tools: Type.Optional(Type.Array(McpToolRequest)),
})

export type UpdateMcpRequestBody = Static<typeof UpdateMcpRequestBody>

export const RotateTokenRequestParams = Type.Object({
    id: ApId,
})
export type RotateTokenRequestParams = Static<typeof RotateTokenRequestParams>

export const GetMcpRequestParams = Type.Object({
    id: ApId,
})
export type GetMcpRequestParams = Static<typeof GetMcpRequestParams>

export const DeleteMcpRequestParams = Type.Object({
    id: ApId,
})
export type DeleteMcpRequestParams = Static<typeof DeleteMcpRequestParams>