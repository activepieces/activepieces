import { RecordedToolCall } from './eval-case'

function create({ recordedToolCalls }: { recordedToolCalls: RecordedToolCall[] }): Replay {
    const used = new Set<number>()
    const divergences: ReplayDivergence[] = []

    const execute = async ({ toolName }: { toolName: string }): Promise<unknown> => {
        const index = recordedToolCalls.findIndex((recorded, position) => !used.has(position) && recorded.toolName === toolName)
        if (index === -1) {
            divergences.push({ toolName, reason: `"${toolName}" was not called at this point in the recorded chat` })
            return { error: REPLAY_ENDED_MESSAGE }
        }
        used.add(index)
        return recordedToolCalls[index].output
    }

    return {
        execute,
        diverged: () => divergences.length > 0,
        divergences: () => [...divergences],
    }
}

const REPLAY_ENDED_MESSAGE = 'This tool is unavailable right now.'

export const replay = {
    create,
}

export type ReplayDivergence = {
    toolName: string
    reason: string
}

export type Replay = {
    execute: (params: { toolName: string }) => Promise<unknown>
    diverged: () => boolean
    divergences: () => ReplayDivergence[]
}
