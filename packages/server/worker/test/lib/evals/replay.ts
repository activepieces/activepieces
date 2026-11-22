import { isNil, isObject } from '@activepieces/core-utils'
import { agentToolClassification, AppConnectionStatus, FlowRunStatus } from '@activepieces/shared'
import { asSchema, ToolSet } from 'ai'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { RecordedToolCall, ToolFault } from './eval-case'

function create({ recordedToolCalls, faults = [] }: { recordedToolCalls: RecordedToolCall[], faults?: ToolFault[] }): Replay {
    const used = new Set<number>()
    const faultsLeft = new Map(faults.map((fault) => [fault.toolName, { error: fault.error, left: fault.times }]))
    const stops: ReplayStop[] = []
    const recorded: RecordedToolCall[] = []

    const take = ({ toolName, input }: { toolName: string, input: unknown }): RecordedLookup => {
        const unused = (position: number): boolean => !used.has(position)
        const key = inputKey(input)
        const matches = (call: RecordedToolCall): boolean => call.toolName === toolName && inputKey(call.input) === key
        const unusedIndex = recordedToolCalls.findIndex((call, position) => unused(position) && matches(call))
        const index = unusedIndex === -1 && isRead(toolName) ? lastIndexWhere({ calls: recordedToolCalls, predicate: matches }) : unusedIndex
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

    const fault = (toolName: string): string | null => {
        const pending = faultsLeft.get(toolName)
        if (isNil(pending) || pending.left === 0) {
            return null
        }
        faultsLeft.set(toolName, { error: pending.error, left: pending.left - 1 })
        return pending.error
    }

    return {
        take,
        stop,
        fault,
        record: (call) => {
            recorded.push(call)
        },
        stops: () => [...stops],
        newFixtures: () => [...recorded],
    }
}

async function resolveCall({ caseReplay, mode, toolName, input, live }: { caseReplay: Replay, mode: ReplayMode, toolName: string, input: unknown, live: (() => Promise<unknown>) | undefined }): Promise<unknown> {
    if (mode === 'live') {
        return resolveLiveCall({ caseReplay, toolName, input, live })
    }
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
    if (mode !== 'record' || isNil(live)) {
        return caseReplay.stop({ toolName, input, kind: 'missing_fixture' })
    }
    const output = await live()
    if (!isErrorOutput(output)) {
        caseReplay.record({ toolName, input, output })
    }
    return output
}

async function resolveLiveCall({ caseReplay, toolName, input, live }: { caseReplay: Replay, toolName: string, input: unknown, live: (() => Promise<unknown>) | undefined }): Promise<unknown> {
    const injected = caseReplay.fault(toolName)
    if (!isNil(injected)) {
        return { content: [{ type: 'text', text: injected }], isError: true }
    }
    if (isStubbed({ toolName, input })) {
        return stubbedResult({ toolName, input })
    }
    if (isNil(live)) {
        throw new Error(`${toolName} has nothing to run in live mode`)
    }
    return live()
}

function isStubbed({ toolName, input }: { toolName: string, input: unknown }): boolean {
    if (toolName !== EXECUTE_ACTION_TOOL) {
        return !runsLive(toolName)
    }
    const actionName = isObject(input) && typeof input['actionName'] === 'string' ? input['actionName'] : ''
    const actionInput = isObject(input) && isObject(input['input']) ? input['input'] : undefined
    return agentToolClassification.requiresActionPreview({ actionName, input: actionInput })
}

function stubbedResult({ toolName, input }: { toolName: string, input: unknown }): unknown {
    const fields = isObject(input) ? input : {}
    switch (toolName) {
        case 'ap_run_code': return { text: '✅ Code ran (no output returned).', producedFiles: [], stubbed: true }
        case 'ap_remember': return { remembered: true, stubbed: true }
        case 'ap_revalidate_connection': return { connectionExternalId: fields['connectionExternalId'], status: AppConnectionStatus.ACTIVE, working: true, note: 'This connection is valid — safe to build on.', stubbed: true }
        case 'ap_create_agent':
        case 'ap_update_agent':
        case 'ap_add_agent_tool':
        case 'ap_remove_agent_tool': return stubbedAgent({ fields, created: toolName === 'ap_create_agent' })
        default: return STUBBED_SUCCESS
    }
}

function stubbedAgent({ fields, created }: { fields: Record<string, unknown>, created: boolean }): unknown {
    const agentId = !created && typeof fields['agentId'] === 'string' ? fields['agentId'] : STUBBED_AGENT_ID
    const displayName = typeof fields['displayName'] === 'string' ? fields['displayName'] : STUBBED_AGENT_NAME
    const published = fields['publish'] === true
    return {
        agentId,
        displayName,
        published,
        url: `${STUBBED_AGENT_URL}/${agentId}`,
        note: published ? `"${displayName}" is live: new runs use this version.` : 'Saved to the draft. Nothing runs this agent until it is published.',
        stubbed: true,
    }
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
    if (!isObject(schema)) {
        return null
    }
    if (!isObject(input)) {
        return 'the input is not an object'
    }
    const properties = isObject(schema['properties']) ? schema['properties'] : {}
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
        return isObject(property) && Array.isArray(property['enum']) && !property['enum'].includes(value)
    })
    return isNil(badEnum) ? null : `${badEnum[0]} ${JSON.stringify(badEnum[1])} is not an allowed value`
}

function lastIndexWhere({ calls, predicate }: { calls: RecordedToolCall[], predicate: (call: RecordedToolCall) => boolean }): number {
    return calls.reduce((last, call, position) => predicate(call) ? position : last, -1)
}

function isErrorOutput(output: unknown): boolean {
    return isObject(output) && !isNil(output['error'])
}

function isStopOutput(output: unknown): boolean {
    return isObject(output) && output['error'] === REPLAY_ENDED_MESSAGE
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

function runsLive(toolName: string): boolean {
    return READ_TOOLS.has(toolName) || WORKSPACE_WRITE_TOOLS.has(toolName)
}

function isLive(toolName: string): boolean {
    return LIVE_TOOLS.has(toolName)
}

function inputKey(input: unknown): string {
    return JSON.stringify(normalized(withoutCardTitles(input)))
}

function withoutCardTitles(input: unknown): unknown {
    return isObject(input) ? Object.fromEntries(Object.entries(input).filter(([key]) => !CARD_TITLE_KEYS.has(key))) : input
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
            .map(([key, inner]) => [key, key === PIECE_NAME_KEY && typeof inner === 'string' ? agentWorkerTools.normalizePieceName(inner.trim()) : normalized(inner)]))
    }
    return value
}

const CARD_TITLE_KEYS = new Set(['title', 'activeTitle', 'doneTitle'])
const PIECE_NAME_KEY = 'pieceName'
const REPLAY_ENDED_MESSAGE = 'This tool is unavailable right now.'
const STALE_REASON_CHARS = 200
const LIVE_TOOLS = new Set([
    'ap_fetch_url',
    'ap_get_tool_schema',
    'ap_load_skill',
    'ap_research_pieces',
    'ap_scrape_url',
    'ap_search_actions',
    'ap_search_triggers',
    'ap_setup_guide',
    'ap_web_search',
])
const EXECUTE_ACTION_TOOL = 'ap_execute_action'
const STUBBED_AGENT_ID = 'evalStubbedAgent'
const STUBBED_AGENT_NAME = 'Eval agent'
const STUBBED_AGENT_URL = 'https://eval.invalid/agents'
const STUBBED_SUCCESS = { content: [{ type: 'text', text: 'Finished successfully.' }], structuredContent: { status: FlowRunStatus.SUCCEEDED } }
const READ_TOOLS = new Set([
    ...LIVE_TOOLS,
    'ap_discover_action_auth',
    'ap_explore_data',
    'ap_find_records',
    'ap_get_piece_props',
    'ap_flow_structure',
    'ap_get_run',
    'ap_list_across_projects',
    'ap_list_agents',
    'ap_list_ai_models',
    'ap_list_connections',
    'ap_list_flows',
    'ap_list_folders',
    'ap_list_runs',
    'ap_list_tables',
    'ap_read_step_code',
    'ap_read_step_settings',
    'ap_resolve_property_chain',
    'ap_resolve_property_options',
    'ap_validate_flow',
    'ap_validate_step_config',
])
const WORKSPACE_WRITE_TOOLS = new Set([
    'ap_add_branch',
    'ap_add_step',
    'ap_apply_flow_operations',
    'ap_build_flow',
    'ap_create_flow',
    'ap_create_folder',
    'ap_create_table',
    'ap_delete_branch',
    'ap_delete_flow',
    'ap_delete_records',
    'ap_delete_step',
    'ap_delete_table',
    'ap_duplicate_flow',
    'ap_insert_records',
    'ap_manage_fields',
    'ap_manage_notes',
    'ap_move_flow_to_folder',
    'ap_rename_flow',
    'ap_update_branch',
    'ap_update_record',
    'ap_update_step',
    'ap_update_trigger',
])
const STUBBED_TOOLS = [
    'ap_add_agent_tool',
    'ap_change_flow_status',
    'ap_create_agent',
    'ap_lock_and_publish',
    'ap_remember',
    'ap_remove_agent_tool',
    'ap_retry_run',
    'ap_revalidate_connection',
    'ap_run_action',
    'ap_run_code',
    'ap_test_flow',
    'ap_test_step',
    'ap_update_agent',
]
const STUBBED_TOOLS_NOTE = 'any other tool that is not a read or a flow, table or folder change'

export const replay = {
    create,
    resolveCall,
    isRead,
    isLive,
    endsTurn,
    isStopOutput,
    splitStale,
    stubbedTools: STUBBED_TOOLS,
    stubbedToolsNote: STUBBED_TOOLS_NOTE,
}

export type StaleRecording = {
    toolName: string
    reason: string
}

export type ReplayMode = 'replay' | 'record' | 'live'

export type ReplayStop = {
    toolName: string
    kind: 'missing_fixture' | 'unrecorded_write' | 'write_input_differs'
    reason: string
}

type RecordedLookup = { found: true, output: unknown } | { found: false, sameToolRecorded: boolean }

export type Replay = {
    take: (params: { toolName: string, input: unknown }) => RecordedLookup
    stop: (params: { toolName: string, input: unknown, kind: ReplayStop['kind'] }) => unknown
    fault: (toolName: string) => string | null
    record: (call: RecordedToolCall) => void
    stops: () => ReplayStop[]
    newFixtures: () => RecordedToolCall[]
}
