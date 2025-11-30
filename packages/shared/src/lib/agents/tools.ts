import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'
import { ApId } from '../common/id-generator'

export const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus'

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
}

const AgentToolBase = {
    toolName: Type.String(),
}

export const AgentPieceToolMetadata = Type.Object({
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionName: Type.String(),
    predefinedInput: Type.Record(Type.String(), Type.Unknown()),
})
export type AgentPieceToolMetadata = Static<typeof AgentPieceToolMetadata>

export const AgentPieceTool = Type.Object({
    type: Type.Literal(AgentToolType.PIECE),
    ...AgentToolBase,
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = Static<typeof AgentPieceTool>

export const AgentFlowTool = Type.Object({
    type: Type.Literal(AgentToolType.FLOW),
    ...AgentToolBase,
    flowId: ApId,
})
export type AgentFlowTool = Static<typeof AgentFlowTool>

export const AgentTool = DiscriminatedUnion('type', [
    AgentPieceTool,
    AgentFlowTool,
])
export type AgentTool = Static<typeof AgentTool>