import { Static, Type } from '@sinclair/typebox'
import { AppConnectionWithoutSensitiveData } from '../../app-connection/app-connection'
import { BaseModelSchema, DiscriminatedUnion } from '../../common'
import { ApId } from '../../common/id-generator'
import { PopulatedFlow } from '../../flows/flow'

export enum McpToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

export const McpFlowToolData = Type.Object({
    type: Type.Literal(McpToolType.FLOW),
    flowIds: Type.Array(ApId),
})

export const McpPieceToolData = Type.Object({
    type: Type.Literal(McpToolType.PIECE),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionNames: Type.Array(Type.String()),
    connectionExternalId: Type.Optional(Type.String()),
})

export const McpToolData = DiscriminatedUnion('type', 
    [McpPieceToolData, McpFlowToolData])

export const McpTool = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(McpToolType),
    mcpId: ApId,
    data: McpToolData,
})

export const McpToolWithFlow = Type.Composite([
    McpTool,
    Type.Object({
        flows: Type.Array(PopulatedFlow),
    }),
])

export const McpToolWithPiece = Type.Composite([
    McpTool,
    Type.Object({
        piece: McpPieceToolData,
        connection: Type.Optional(AppConnectionWithoutSensitiveData),
    }),
])


export type McpFlowToolData = Static<typeof McpFlowToolData>
export type McpPieceToolData = Static<typeof McpPieceToolData>
export type McpToolData = Static<typeof McpToolData>
export type McpTool = Static<typeof McpTool>
export type McpToolWithFlow = Static<typeof McpToolWithFlow>
export type McpToolWithPiece = Static<typeof McpToolWithPiece>