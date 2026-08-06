import { AgentPieceTool, AgentResult, AgentStepBlock, AgentTaskStatus, ContentBlockType, PersistedAgentPart, PersistedAgentPartType, PersistedToolCallStatus, ToolCallStatus, ToolCallType } from '@activepieces/shared'

const MAX_RESULT_LENGTH = 262_144

export function stepResultFrom({ prompt, uiParts, timestamp, tools, failure }: {
    prompt: string
    uiParts: PersistedAgentPart[]
    timestamp: string
    tools: AgentPieceTool[]
    failure?: string
}): AgentResult {
    const configured = new Map(tools.map((tool) => [tool.toolName, tool.pieceMetadata]))
    const steps = withinBudget(uiParts.flatMap((part) => toStepBlocks({ part, timestamp, configured })))
    const anyToolFailed = uiParts.some((part) => part.type === PersistedAgentPartType.TOOL_CALL && part.status === PersistedToolCallStatus.ERROR)
    if (failure === undefined) {
        return { prompt, steps, status: anyToolFailed ? AgentTaskStatus.FAILED : AgentTaskStatus.COMPLETED }
    }
    return {
        prompt,
        steps: [...steps, { type: ContentBlockType.MARKDOWN, markdown: failure }],
        status: AgentTaskStatus.FAILED,
    }
}

function withinBudget(steps: AgentStepBlock[]): AgentStepBlock[] {
    let spent = 0
    return steps.filter((step) => {
        spent += JSON.stringify(step).length
        return spent <= MAX_RESULT_LENGTH
    })
}

function toStepBlocks({ part, timestamp, configured }: { part: PersistedAgentPart, timestamp: string, configured: Map<string, AgentPieceTool['pieceMetadata']> }): AgentStepBlock[] {
    switch (part.type) {
        case PersistedAgentPartType.TEXT:
        case PersistedAgentPartType.REASONING:
            return part.text.trim().length === 0 ? [] : [{ type: ContentBlockType.MARKDOWN, markdown: part.text }]
        case PersistedAgentPartType.TOOL_CALL: {
            const piece = configured.get(part.toolName)
            return [{
                type: ContentBlockType.TOOL_CALL,
                ...(piece === undefined
                    ? { toolCallType: ToolCallType.UNKNOWN, displayName: part.title ?? part.toolName }
                    : { toolCallType: ToolCallType.PIECE, pieceName: piece.pieceName, pieceVersion: piece.pieceVersion, actionName: piece.actionName }),
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                input: part.input,
                output: part.status === PersistedToolCallStatus.ERROR ? { failed: true, error: part.errorText ?? 'The action failed' } : part.output,
                status: ToolCallStatus.COMPLETED,
                startTime: timestamp,
                endTime: timestamp,
            }]
        }
        default:
            return []
    }
}
