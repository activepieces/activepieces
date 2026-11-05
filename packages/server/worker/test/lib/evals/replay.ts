import { RecordedToolCall } from './eval-case'

function create({ recordedToolCalls }: { recordedToolCalls: RecordedToolCall[] }): Replay {
    const used = new Set<number>()
    const stops: ReplayStop[] = []
    const recorded: RecordedToolCall[] = []

    const take = ({ toolName, input, sameInputOnly }: { toolName: string, input: unknown, sameInputOnly: boolean }): RecordedLookup => {
        const unused = (position: number): boolean => !used.has(position)
        const key = inputKey(input)
        const sameInput = recordedToolCalls.findIndex((call, position) => unused(position) && call.toolName === toolName && inputKey(call.input) === key)
        const sameTool = sameInputOnly ? -1 : recordedToolCalls.findIndex((call, position) => unused(position) && call.toolName === toolName)
        const index = sameInput === -1 ? sameTool : sameInput
        if (index === -1) {
            return { found: false }
        }
        used.add(index)
        return { found: true, output: recordedToolCalls[index].output }
    }

    const stop = ({ toolName, input, kind }: { toolName: string, input: unknown, kind: ReplayStop['kind'] }): unknown => {
        const reason = kind === 'missing_fixture'
            ? `no fixture for read "${toolName}" with input ${inputKey(input)} (run with --record to add one)`
            : `"${toolName}" changes data and was not called at this point in the recorded chat`
        stops.push({ toolName, kind, reason })
        return { error: REPLAY_ENDED_MESSAGE }
    }

    return {
        take,
        stop,
        record: (call) => {
            recorded.push(call)
        },
        execute: async ({ toolName, input }) => {
            const lookup = take({ toolName, input, sameInputOnly: false })
            return lookup.found ? lookup.output : stop({ toolName, input, kind: 'unrecorded_write' })
        },
        stopped: () => stops.length > 0,
        stops: () => [...stops],
        newFixtures: () => [...recorded],
    }
}

function inputKey(input: unknown): string {
    return JSON.stringify(withoutCardTitles(input))
}

function withoutCardTitles(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(withoutCardTitles)
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(Object.entries(value)
            .filter(([key]) => !CARD_TITLE_KEYS.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, inner]) => [key, withoutCardTitles(inner)]))
    }
    return value
}

const CARD_TITLE_KEYS = new Set(['title', 'activeTitle', 'doneTitle'])
const REPLAY_ENDED_MESSAGE = 'This tool is unavailable right now.'

export const replay = {
    create,
}

export type ReplayStop = {
    toolName: string
    kind: 'missing_fixture' | 'unrecorded_write'
    reason: string
}

type RecordedLookup = { found: true, output: unknown } | { found: false }

export type Replay = {
    take: (params: { toolName: string, input: unknown, sameInputOnly: boolean }) => RecordedLookup
    stop: (params: { toolName: string, input: unknown, kind: ReplayStop['kind'] }) => unknown
    record: (call: RecordedToolCall) => void
    execute: (params: { toolName: string, input: unknown }) => Promise<unknown>
    stopped: () => boolean
    stops: () => ReplayStop[]
    newFixtures: () => RecordedToolCall[]
}
