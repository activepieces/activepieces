import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../../common'
import { ApId } from '../../common/id-generator'
import { PopulatedFlow } from '../../flows'

export enum ToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

export const PieceToolData = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
    actionDisplayName: Type.String(),
    logoUrl: Type.String(),
    connectionExternalId: Type.Optional(Type.String()),
})
export type PieceToolData = Static<typeof PieceToolData>

const ToolBase = {
    ...BaseModelSchema,
    externalId: Type.String(),
    toolName: Type.String(),
    mcpId: Type.String(),
}
export const PieceTool = Type.Object({
    type: Type.Literal(ToolType.PIECE),
    ...ToolBase,
    pieceMetadata: PieceToolData,
})
export type PieceTool = Static<typeof PieceTool>
export const FlowTool = Type.Object({
    type: Type.Literal(ToolType.FLOW),
    ...ToolBase,
    flowId: ApId,
    flow: PopulatedFlow,
})
export type FlowTool = Static<typeof FlowTool>

export const Tool = DiscriminatedUnion('type', [
    PieceTool,
    FlowTool,
])

export type Tool = Static<typeof Tool>

export const  ToolsListResult = Type.Object({
    result: Type.Object({
        tools: Type.Array(Type.Object({
            name: Type.String(),
            description: Type.Optional(Type.String()),
            inputSchema: Type.Record(Type.String(), Type.Any()),
        })),
    }),
})
export type ToolsListResult = Static<typeof ToolsListResult>

export const ToolCallResult = Type.Object({
    result: Type.Object({
        success: Type.Optional(Type.Boolean()),
        content: Type.Optional(Type.Array(Type.Object({
            text: Type.Optional(Type.String()),
        }))),
    }),
})
export type ToolCallResult = Static<typeof ToolCallResult>

export type McpResult = ToolsListResult | ToolCallResult