import { AgentResult, AgentStepBlock, AgentTaskStatus, AgentTool, AgentToolType, ContentBlockType, PersistedAgentPart, PersistedAgentPartType, PersistedToolCallStatus, ToolCallStatus, ToolCallType } from '@activepieces/shared'

const MAX_RESULT_LENGTH = 262_144

export function stepResultFrom({ prompt, uiParts, timestamp, tools, structuredOutput, failure, stillRunning }: {
    prompt: string
    uiParts: PersistedAgentPart[]
    timestamp: string
    tools: AgentTool[]
    structuredOutput?: Record<string, unknown>
    failure?: string
    stillRunning?: boolean
}): AgentResult {
    const configured = new Map(tools.map((tool) => [tool.toolName, tool]))
    const steps = withinBudget(uiParts.flatMap((part) => toStepBlocks({ part, timestamp, configured })))
    const anyToolFailed = uiParts.some((part) => part.type === PersistedAgentPartType.TOOL_CALL && part.status === PersistedToolCallStatus.ERROR)
    if (failure === undefined) {
        return { prompt, steps, status: stillRunning === true ? AgentTaskStatus.IN_PROGRESS : (anyToolFailed ? AgentTaskStatus.FAILED : AgentTaskStatus.COMPLETED), ...(structuredOutput === undefined ? {} : { structuredOutput }) }
    }
    return {
        prompt,
        steps: [...steps, { type: ContentBlockType.MARKDOWN, markdown: failure }],
        status: AgentTaskStatus.FAILED,
        ...(structuredOutput === undefined ? {} : { structuredOutput }),
    }
}

function withinBudget(steps: AgentStepBlock[]): AgentStepBlock[] {
    let spent = 0
    const kept: AgentStepBlock[] = []
    for (const step of steps) {
        spent += JSON.stringify(step).length
        if (spent > MAX_RESULT_LENGTH) {
            break
        }
        kept.push(step)
    }
    if (kept.length === steps.length) {
        return kept
    }
    return [...kept, { type: ContentBlockType.MARKDOWN, markdown: `The last ${steps.length - kept.length} steps are not shown here because the result grew too large. The full transcript has them.` }]
}

function toStepBlocks({ part, timestamp, configured }: { part: PersistedAgentPart, timestamp: string, configured: Map<string, AgentTool> }): AgentStepBlock[] {
    switch (part.type) {
        case PersistedAgentPartType.TEXT:
        case PersistedAgentPartType.REASONING:
            return part.text.trim().length === 0 ? [] : [{ type: ContentBlockType.MARKDOWN, markdown: part.text }]
        case PersistedAgentPartType.TOOL_CALL: {
            const tool = configured.get(part.toolName)
            const variant = tool?.type === AgentToolType.PIECE
                ? { toolCallType: ToolCallType.PIECE as const, pieceName: tool.pieceMetadata.pieceName, pieceVersion: tool.pieceMetadata.pieceVersion, actionName: tool.pieceMetadata.actionName }
                : tool?.type === AgentToolType.KNOWLEDGE_BASE
                    ? { toolCallType: ToolCallType.KNOWLEDGE_BASE as const, displayName: tool.sourceName, sourceType: tool.sourceType }
                    : { toolCallType: ToolCallType.UNKNOWN as const, displayName: part.title ?? part.toolName }
            return [{
                type: ContentBlockType.TOOL_CALL,
                ...variant,
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
