import { AgentResult, AgentStepBlock, AgentTaskStatus, ContentBlockType, PersistedAgentPart, PersistedAgentPartType, PersistedToolCallStatus, ToolCallStatus, ToolCallType } from '@activepieces/shared'
import { agentWorkerTools } from './agent-worker-tools'

const MAX_BLOCK_LENGTH = 51_200
const MAX_BLOCKS = 200
const OUTPUT_LIMITS = { maxStringLength: 8_192, maxArrayItems: 50 }

export function stepResultFrom({ prompt, uiParts, timestamp, failure }: {
    prompt: string
    uiParts: PersistedAgentPart[]
    timestamp: string
    failure?: string
}): AgentResult {
    const steps = uiParts.flatMap((part) => toStepBlocks({ part, timestamp })).slice(0, MAX_BLOCKS)
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
                output: agentWorkerTools.shrinkLargeValue(part.status === PersistedToolCallStatus.ERROR ? { failed: true, error: part.errorText ?? 'The action failed' } : part.output, OUTPUT_LIMITS),
                status: ToolCallStatus.COMPLETED,
                startTime: timestamp,
                endTime: timestamp,
            }]
        default:
            return []
    }
}

