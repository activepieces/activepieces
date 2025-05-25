import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'
import { ApId } from '../../common/id-generator'

export const McpToolHistory = Type.Object({
    ...BaseModelSchema,
    mcpId: ApId,
    toolName: Type.String(),
    input: Type.Object({}),
    output: Type.Object({}),
    success: Type.Boolean(),
})

export const McpPieceToolHistory = Type.Composite([
    McpToolHistory,
    Type.Object({
        pieceName: Type.String(),
        pieceVersion: Type.String(),
    }),
])

export type McpPieceToolHistory = Static<typeof McpPieceToolHistory>


export const McpFlowToolHistory = Type.Composite([
    McpToolHistory,
    Type.Object({
        flowId: ApId,
        flowVersionId: ApId,
    }),
])

export type McpFlowToolHistory = Static<typeof McpFlowToolHistory>