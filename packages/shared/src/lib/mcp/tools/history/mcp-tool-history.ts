import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../../common'
import { ApId } from '../../../common/id-generator'

export enum McpToolHistoryStatus {
    SUCCESS = 'Success',
    FAILED = 'Failed',
}

export const McpPieceToolHistoryMetadata = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
})

export type McpPieceToolHistoryMetadata = Static<typeof McpPieceToolHistoryMetadata>

export const McpFlowToolHistoryMetadata = Type.Object({
    flowId: ApId,
    flowVersionId: ApId,
})

export type McpFlowToolHistoryMetadata = Static<typeof McpFlowToolHistoryMetadata>

export const McpToolHistory = Type.Object({
    ...BaseModelSchema,
    mcpId: ApId,
    toolId: ApId,
    metadata: Type.Union([McpPieceToolHistoryMetadata, McpFlowToolHistoryMetadata]),
    input: Type.Any(),
    output: Type.Any(),
    status: Type.Enum(McpToolHistoryStatus),
})

export type McpToolHistory = Static<typeof McpToolHistory>