import { AgentResult, AgentStepBlock, AgentTaskStatus, ContentBlockType, PersistedAgentPart, PersistedAgentPartType, PersistedToolCallStatus, ToolCallStatus, ToolCallType } from '@activepieces/shared'

const MAX_BLOCK_LENGTH = 51_200
const MAX_RESULT_LENGTH = 262_144

export function stepResultFrom({ prompt, uiParts, timestamp, failure }: {
    prompt: string
    uiParts: PersistedAgentPart[]
    timestamp: string
    failure?: string
}): AgentResult {
    const steps = withinBudget(uiParts.flatMap((part) => toStepBlocks({ part, timestamp })))
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
    const kept: AgentStepBlock[] = []
    let spent = 0
    for (const step of steps) {
        spent += JSON.stringify(step).length
        if (spent > MAX_RESULT_LENGTH) {
            kept.push({ type: ContentBlockType.MARKDOWN, markdown: `The remaining ${steps.length - kept.length} steps were left out because the result grew too large to hand back.` })
            return kept
        }
        kept.push(step)
    }
    return kept
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
                output: part.status === PersistedToolCallStatus.ERROR ? { failed: true, error: part.errorText ?? 'The action failed' } : part.output,
                status: ToolCallStatus.COMPLETED,
                startTime: timestamp,
                endTime: timestamp,
            }]
        default:
            return []
    }
}
