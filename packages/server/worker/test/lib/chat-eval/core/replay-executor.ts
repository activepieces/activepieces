import { ChatEvalRecordedToolCall } from './fixture'

function createReplayExecutor({ recordedToolCalls }: { recordedToolCalls: ChatEvalRecordedToolCall[] }): ReplayExecutor {
    const ordered = [...recordedToolCalls].sort((a, b) => a.order - b.order)
    const divergences: ReplayDivergence[] = []
    let cursor = 0

    const executeTool = async (toolName: string): Promise<unknown> => {
        const recorded = ordered[cursor]
        const position = cursor
        cursor++

        if (isNilRecord(recorded) || recorded.toolName !== toolName) {
            divergences.push({
                position,
                expectedTool: recorded?.toolName ?? null,
                actualTool: toolName,
                reason: isNilRecord(recorded)
                    ? `agent called "${toolName}" but the recording has no tool at position ${position}`
                    : `agent called "${toolName}" but the recording expected "${recorded.toolName}" at position ${position}`,
            })
            return { __evalDivergence: true, toolName, position }
        }

        return recorded.output
    }

    return {
        executeTool,
        getDivergences: () => [...divergences],
    }
}

function isNilRecord(record: ChatEvalRecordedToolCall | undefined): record is undefined {
    return record === undefined
}

export const replayExecutor = {
    create: createReplayExecutor,
}

export type ReplayDivergence = {
    position: number
    expectedTool: string | null
    actualTool: string
    reason: string
}

export type ReplayExecutor = {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    getDivergences: () => ReplayDivergence[]
}
