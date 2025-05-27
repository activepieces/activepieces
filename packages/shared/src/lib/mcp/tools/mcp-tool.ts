import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'
import { ApId } from '../../common/id-generator'

export enum McpToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

export const McpPieceToolData = Type.Object({
    type: Type.Literal(McpToolType.PIECE),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionNames: Type.Array(Type.String()),
    connectionExternalId: Type.Optional(Type.String()),
})
export type McpPieceToolData = Static<typeof McpPieceToolData>

export const McpTool = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(McpToolType),
    mcpId: ApId,
    pieceMetadata: Type.Optional(McpPieceToolData),
    flowId: Type.Optional(ApId),
})

export type McpTool = Static<typeof McpTool>