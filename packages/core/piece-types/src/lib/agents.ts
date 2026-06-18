import { z } from 'zod'

export enum AgentToolType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum FieldControlMode {
    AGENT_DECIDE = 'agent-decide',
    CHOOSE_YOURSELF = 'choose-yourself',
    LEAVE_EMPTY = 'leave-empty',
}

export const PredefinedInputField = z.object({
    mode: z.nativeEnum(FieldControlMode),
    value: z.unknown(),
})
export type PredefinedInputField = z.infer<typeof PredefinedInputField>

export const PredefinedInputsStructure = z.object({
    auth: z.string().optional(),
    fields: z.record(z.string(), PredefinedInputField),
})
export type PredefinedInputsStructure = z.infer<typeof PredefinedInputsStructure>

export const AgentPieceToolMetadata = z.object({
    pieceName: z.string(),
    pieceVersion: z.string(),
    actionName: z.string(),
    predefinedInput: PredefinedInputsStructure.optional(),
})
export type AgentPieceToolMetadata = z.infer<typeof AgentPieceToolMetadata>

export const AgentPieceTool = z.object({
    type: z.literal(AgentToolType.PIECE),
    toolName: z.string().min(1),
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = z.infer<typeof AgentPieceTool>
