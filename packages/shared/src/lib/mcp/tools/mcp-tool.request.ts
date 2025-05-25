import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../common'
import { McpFlowToolData, McpPieceToolData, McpToolType } from './mcp-tool'
import { ApId } from '../../common/id-generator'

export const UpsertMcpFlowToolRequestBody = Type.Object({
    type: Type.Literal(McpToolType.FLOW),
    mcpId: ApId,
    data: McpFlowToolData,
})


export const UpsertMcpPieceToolRequestBody = Type.Object({
    type: Type.Literal(McpToolType.PIECE),
    mcpId: ApId,
    data: McpPieceToolData,
})

export const UpsertMcpToolRequestBody = DiscriminatedUnion('type', [
    UpsertMcpFlowToolRequestBody,
    UpsertMcpPieceToolRequestBody,
])

export type UpsertMcpToolRequestBody = Static<typeof UpsertMcpToolRequestBody>
export type UpsertMcpFlowToolRequestBody = Static<typeof UpsertMcpFlowToolRequestBody>
export type UpsertMcpPieceToolRequestBody = Static<typeof UpsertMcpPieceToolRequestBody>