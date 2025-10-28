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
    externalId: Type.String(),
    toolName: Type.String(),
    mcpId: Type.String(),
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

export const  McpToolsListResult = Type.Object({
    result: Type.Object({
        tools: Type.Array(Type.Object({
            name: Type.String(),
            description: Type.Optional(Type.String()),
            inputSchema: Type.Record(Type.String(), Type.Any()),
        })),
    }),
})
export type McpToolsListResult = Static<typeof McpToolsListResult>

export const McpToolCallResult = Type.Object({
    result: Type.Object({
        success: Type.Optional(Type.Boolean()),
        content: Type.Optional(Type.Array(Type.Object({
            text: Type.Optional(Type.String()),
        }))),
    }),
})
export type McpToolCallResult = Static<typeof McpToolCallResult>

export type McpResult = McpToolsListResult | McpToolCallResult