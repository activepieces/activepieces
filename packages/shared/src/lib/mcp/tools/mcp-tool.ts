import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../../common'
import { ApId } from '../../common/id-generator'
import { PopulatedFlow } from '../../flows'

export enum McpToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

export const McpPieceToolData = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
    actionDisplayName: Type.String(),
    logoUrl: Type.String(),
    connectionExternalId: Type.Optional(Type.String()),
})
export type McpPieceToolData = Static<typeof McpPieceToolData>

const McpToolBase = {
    ...BaseModelSchema,
    externalId: ApId,
    toolName: Type.Optional(Type.String()),
    mcpId: ApId,
}
export const McpPieceTool = Type.Object({
    type: Type.Literal(McpToolType.PIECE),
    ...McpToolBase,
    pieceMetadata: McpPieceToolData,
})
export type McpPieceTool = Static<typeof McpPieceTool>
export const McpFlowTool = Type.Object({
    type: Type.Literal(McpToolType.FLOW),
    ...McpToolBase,
    flowId: ApId,
    flow: PopulatedFlow,
})
export type McpFlowTool = Static<typeof McpFlowTool>

export const McpTool = DiscriminatedUnion('type', [
    McpPieceTool,
    McpFlowTool,
])

export type McpTool = Static<typeof McpTool>