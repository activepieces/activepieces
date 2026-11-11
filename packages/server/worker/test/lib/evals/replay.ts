import { isNil } from '@activepieces/core-utils'
import { asSchema, ToolSet } from 'ai'
import { RecordedToolCall } from './eval-case'

function create({ recordedToolCalls }: { recordedToolCalls: RecordedToolCall[] }): Replay {
    const used = new Set<number>()
    const stops: ReplayStop[] = []
    const recorded: RecordedToolCall[] = []

    const take = ({ toolName, input }: { toolName: string, input: unknown }): RecordedLookup => {
        const unused = (position: number): boolean => !used.has(position)
        const key = inputKey(input)
        const index = recordedToolCalls.findIndex((call, position) => unused(position) && call.toolName === toolName && inputKey(call.input) === key)
        if (index === -1) {
            return { found: false, sameToolRecorded: recordedToolCalls.some((call, position) => unused(position) && call.toolName === toolName) }
        }
        used.add(index)
        return { found: true, output: recordedToolCalls[index].output }
    }

    const stop = ({ toolName, input, kind }: { toolName: string, input: unknown, kind: ReplayStop['kind'] }): unknown => {
        stops.push({ toolName, kind, reason: stopReason({ toolName, input, kind }) })
        return { error: REPLAY_ENDED_MESSAGE }
    }

    return {
        take,
        stop,
        record: (call) => {
            recorded.push(call)
        },
        stops: () => [...stops],
        newFixtures: () => [...recorded],
    }
}

async function resolveCall({ caseReplay, recordMode, toolName, input, live }: { caseReplay: Replay, recordMode: boolean, toolName: string, input: unknown, live: (() => Promise<unknown>) | undefined }): Promise<unknown> {
    if (isLive(toolName) && !isNil(live)) {
        return live()
    }
    const read = isRead(toolName)
    const fixture = caseReplay.take({ toolName, input })
    if (fixture.found === true) {
        return fixture.output
    }
    if (!read) {
        return caseReplay.stop({ toolName, input, kind: fixture.sameToolRecorded ? 'write_input_differs' : 'unrecorded_write' })
    }
    if (!recordMode || isNil(live)) {
        return caseReplay.stop({ toolName, input, kind: 'missing_fixture' })
    }
    const output = await live()
    caseReplay.record({ toolName, input, output })
    return output
}

async function splitStale({ tools, recordedToolCalls }: { tools: ToolSet, recordedToolCalls: RecordedToolCall[] }): Promise<{ fresh: RecordedToolCall[], stale: StaleRecording[] }> {
    const replayable = recordedToolCalls.filter((call) => !isLive(call.toolName))
    const checked = await Promise.all(replayable.map(async (call) => ({ call, problem: await staleness({ tools, call }) })))
    return {
        fresh: checked.flatMap(({ call, problem }) => isNil(problem) ? [call] : []),
        stale: checked.flatMap(({ call, problem }) => isNil(problem) ? [] : [{ toolName: call.toolName, reason: problem }]),
    }
}

async function staleness({ tools, call }: { tools: ToolSet, call: RecordedToolCall }): Promise<string | null> {
    const tool = tools[call.toolName]
    if (isNil(tool)) {
        return 'the agent is no longer offered this tool'
    }
    const schema = asSchema(tool.inputSchema)
    if (!isNil(schema.validate)) {
        const result = await schema.validate(call.input)
        return result.success === true ? null : `the tool's input schema rejects the recorded input: ${result.error.message.slice(0, STALE_REASON_CHARS)}`
    }
    const problem = jsonSchemaProblem({ schema: await schema.jsonSchema, input: call.input })
    return isNil(problem) ? null : `the tool's input schema rejects the recorded input: ${problem}`
}

function jsonSchemaProblem({ schema, input }: { schema: unknown, input: unknown }): string | null {
    if (!isRecord(schema)) {
        return null
    }
    if (!isRecord(input)) {
        return 'the input is not an object'
    }
    const properties = isRecord(schema['properties']) ? schema['properties'] : {}
    const required = Array.isArray(schema['required']) ? schema['required'].filter((key): key is string => typeof key === 'string') : []
    const missing = required.filter((key) => !(key in input))
    if (missing.length > 0) {
        return `missing required ${missing.join(', ')}`
    }
    const unknownKeys = schema['additionalProperties'] === false ? Object.keys(input).filter((key) => !(key in properties)) : []
    if (unknownKeys.length > 0) {
        return `unknown ${unknownKeys.join(', ')}`
    }
    const badEnum = Object.entries(input).find(([key, value]) => {
        const property = properties[key]
        return isRecord(property) && Array.isArray(property['enum']) && !property['enum'].includes(value)
    })
    return isNil(badEnum) ? null : `${badEnum[0]} ${JSON.stringify(badEnum[1])} is not an allowed value`
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function endsTurn(stop: ReplayStop): boolean {
    return stop.kind !== 'missing_fixture'
}

function stopReason({ toolName, input, kind }: { toolName: string, input: unknown, kind: ReplayStop['kind'] }): string {
    switch (kind) {
        case 'missing_fixture': return `no fixture for read "${toolName}" with input ${inputKey(input)} (run with --record to add one)`
        case 'unrecorded_write': return `"${toolName}" changes data and was not called at this point in the recorded chat`
        case 'write_input_differs': return `"${toolName}" changes data and its input differs from the recording: ${inputKey(input)}`
    }
}

function isRead(toolName: string): boolean {
    return READ_TOOLS.has(toolName)
}

function isLive(toolName: string): boolean {
    return LIVE_TOOLS.has(toolName)
}

function inputKey(input: unknown): string {
    return JSON.stringify(normalized(withoutCardTitles(input)))
}

function withoutCardTitles(input: unknown): unknown {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return input
    }
    return Object.fromEntries(Object.entries(input).filter(([key]) => !CARD_TITLE_KEYS.has(key)))
}

function normalized(value: unknown): unknown {
    if (typeof value === 'string') {
        return value.trim().replace(/\s+/g, ' ')
    }
    if (Array.isArray(value)) {
        return value.map(normalized)
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, inner]) => [key, key === PIECE_NAME_KEY && typeof inner === 'string' ? canonicalPieceName(inner.trim()) : normalized(inner)]))
    }
    return value
}

function canonicalPieceName(pieceName: string): string {
    if (pieceName.startsWith('@')) {
        return pieceName
    }
    const short = pieceName.startsWith('piece-') ? pieceName.slice('piece-'.length) : pieceName
    return `${PIECE_PREFIX}${short.replace(/_/g, '-')}`
}

const CARD_TITLE_KEYS = new Set(['title', 'activeTitle', 'doneTitle'])
const PIECE_NAME_KEY = 'pieceName'
const PIECE_PREFIX = '@activepieces/piece-'
const REPLAY_ENDED_MESSAGE = 'This tool is unavailable right now.'
const STALE_REASON_CHARS = 200
const LIVE_TOOLS = new Set([
    'ap_fetch_url',
    'ap_get_piece_props',
    'ap_get_tool_schema',
    'ap_load_skill',
    'ap_research_pieces',
    'ap_scrape_url',
    'ap_search_actions',
    'ap_search_triggers',
    'ap_setup_guide',
    'ap_web_search',
])
const READ_TOOLS = new Set([
    'ap_discover_action_auth',
    'ap_explore_data',
    'ap_fetch_url',
    'ap_find_records',
    'ap_flow_structure',
    'ap_get_piece_props',
    'ap_get_run',
    'ap_get_tool_schema',
    'ap_list_across_projects',
    'ap_list_agents',
    'ap_list_ai_models',
    'ap_list_connections',
    'ap_list_flows',
    'ap_list_folders',
    'ap_list_runs',
    'ap_list_tables',
    'ap_load_skill',
    'ap_read_step_code',
    'ap_read_step_settings',
    'ap_research_pieces',
    'ap_resolve_property_chain',
    'ap_resolve_property_options',
    'ap_scrape_url',
    'ap_search_actions',
    'ap_search_triggers',
    'ap_setup_guide',
    'ap_validate_flow',
    'ap_validate_step_config',
    'ap_web_search',
])

export const replay = {
    create,
    resolveCall,
    isRead,
    isLive,
    endsTurn,
    splitStale,
}

export type StaleRecording = {
    toolName: string
    reason: string
}

export type ReplayStop = {
    toolName: string
    kind: 'missing_fixture' | 'unrecorded_write' | 'write_input_differs'
    reason: string
}

type RecordedLookup = { found: true, output: unknown } | { found: false, sameToolRecorded: boolean }

export type Replay = {
    take: (params: { toolName: string, input: unknown }) => RecordedLookup
    stop: (params: { toolName: string, input: unknown, kind: ReplayStop['kind'] }) => unknown
    record: (call: RecordedToolCall) => void
    stops: () => ReplayStop[]
    newFixtures: () => RecordedToolCall[]
}
