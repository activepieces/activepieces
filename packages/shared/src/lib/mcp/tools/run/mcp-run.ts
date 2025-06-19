import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../../common'
import { ApId } from '../../../common/id-generator'

export enum McpRunStatus {
    SUCCESS = 'Success',
    FAILED = 'Failed',
}

export const McpPieceRunMetadata = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
})

export type McpPieceRunMetadata = Static<typeof McpPieceRunMetadata>

export const McpFlowRunMetadata = Type.Object({
    flowId: ApId,
    flowVersionId: ApId,
    name: Type.String(),
})

export type McpFlowRunMetadata = Static<typeof McpFlowRunMetadata>

export const McpRun = Type.Object({
    ...BaseModelSchema,
    mcpId: ApId,
    projectId: ApId,
    toolId: ApId,
    metadata: Type.Union([McpPieceRunMetadata, McpFlowRunMetadata]),
    input: Type.Any(),
    output: Type.Any(),
    status: Type.Enum(McpRunStatus),
})

export type McpRun = Static<typeof McpRun>