import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
import { McpTool } from './tools/mcp-tool'

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


export const UpdateMcpRequestBody = Type.Object({
    name: Type.Optional(Type.String({})),
    tools: Type.Optional(Type.Array( Type.Omit(McpTool, ['id', 'created', 'updated']))),
})

export type UpdateMcpRequestBody = Static<typeof UpdateMcpRequestBody>


export const UpsertMcpPieceRequestBody = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionNames: Type.Array(Type.String()),
    connectionId: Nullable(Type.String()),
})

export type UpsertMcpPieceRequestBody = Static<typeof UpsertMcpPieceRequestBody>


export const UpdateMcpFlowsRequestBody = Type.Object({
    flowIds: Type.Array(Type.String()),
})
export type UpdateMcpFlowsRequestBody = Static<typeof UpdateMcpFlowsRequestBody>