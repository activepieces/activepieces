import * as z from "zod/mini";

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
    mode: z.enum(FieldControlMode),
    value: z.unknown(),
})
export type PredefinedInputField = z.infer<typeof PredefinedInputField>

export const PredefinedInputsStructure = z.object({
    auth: z.optional(z.string()),
    fields: z.record(z.string(), PredefinedInputField),
})
export type PredefinedInputsStructure = z.infer<typeof PredefinedInputsStructure>

export const AgentPieceToolMetadata = z.object({
    pieceName: z.string(),
    pieceVersion: z.string(),
    actionName: z.string(),
    predefinedInput: z.optional(PredefinedInputsStructure),
})
export type AgentPieceToolMetadata = z.infer<typeof AgentPieceToolMetadata>

export const AgentPieceTool = z.object({
    type: z.literal(AgentToolType.PIECE),
    toolName: z.string().check(z.minLength(1)),
    pieceMetadata: AgentPieceToolMetadata,
})
export type AgentPieceTool = z.infer<typeof AgentPieceTool>
