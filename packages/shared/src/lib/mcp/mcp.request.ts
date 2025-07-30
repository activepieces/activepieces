import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common/base-model'
import { McpPieceToolData, McpToolType } from './tools/mcp-tool'

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
    }),
    Type.Object({
        type: Type.Literal(McpToolType.FLOW),
        flowId: Type.String(),
    }),
])
export type McpToolRequest = Static<typeof McpToolRequest>

export const UpdateMcpRequestBody = Type.Object({
    name: Type.Optional(Type.String({})),
    tools: Type.Optional(Type.Array(McpToolRequest)),
})

export type UpdateMcpRequestBody = Static<typeof UpdateMcpRequestBody>
