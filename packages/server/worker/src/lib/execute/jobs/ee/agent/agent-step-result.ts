import { AgentResult, AgentStepBlock, AgentTaskStatus, ContentBlockType, PersistedAgentPart, PersistedAgentPartType, ToolCallStatus, ToolCallType } from '@activepieces/shared'

const MAX_BLOCK_LENGTH = 51_200

export function stepResultFrom({ prompt, uiParts, timestamp, failure }: {
    prompt: string
    uiParts: PersistedAgentPart[]
    timestamp: string
    failure?: string
}): AgentResult {
    const steps = uiParts.flatMap((part) => toStepBlocks({ part, timestamp }))
    if (failure === undefined) {
        return { prompt, steps, status: AgentTaskStatus.COMPLETED }
    }
    return {
        prompt,
        steps: [...steps, { type: ContentBlockType.MARKDOWN, markdown: failure }],
        status: AgentTaskStatus.FAILED,
    }
}

function toStepBlocks({ part, timestamp }: { part: PersistedAgentPart, timestamp: string }): AgentStepBlock[] {
    switch (part.type) {
        case PersistedAgentPartType.TEXT:
        case PersistedAgentPartType.REASONING:
            return part.text.trim().length === 0 ? [] : [{ type: ContentBlockType.MARKDOWN, markdown: part.text.slice(0, MAX_BLOCK_LENGTH) }]
        case PersistedAgentPartType.TOOL_CALL:
            return [{
                type: ContentBlockType.TOOL_CALL,
                toolCallType: ToolCallType.UNKNOWN,
                displayName: part.title ?? part.toolName,
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                input: part.input,
                output: part.output,
                status: ToolCallStatus.COMPLETED,
                startTime: timestamp,
                endTime: timestamp,
            }]
        default:
            return []
    }
}
