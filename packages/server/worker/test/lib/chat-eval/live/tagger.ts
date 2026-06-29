import { chatToolClassification, PersistedChatPartType, PersistedChatRole, PersistedToolCallStatus } from '@activepieces/shared'
import { LiveScenario } from './scenarios'

const EXECUTE_TOOL = 'ap_execute_action'
const CODE_TOOL = 'ap_run_code'
const EMAIL_TOOL = 'ap_send_email'
const FETCH_TOOL = 'ap_fetch_url'
// The agent "did the work" via any of these — not just ap_execute_action. The built-in email and
// code tools are first-class execution paths; counting only ap_execute_action mislabels them.
const WORK_TOOLS = [EXECUTE_TOOL, EMAIL_TOOL, CODE_TOOL]
// A turn that ends here (with no work) is correctly blocked awaiting a connection the env lacks —
// that is NOT "gave up". Without connections, most piece scenarios legitimately end here.
const CONNECTION_BLOCK_TOOLS = ['ap_show_connection_picker', 'ap_show_connection_required', 'ap_show_mcp_reconnect']
const SCHEMA_TOOLS = ['ap_get_piece_props', 'ap_prepare_action']
const DISCOVERY_TOOLS = ['ap_research_pieces', 'ap_get_piece_props', 'ap_prepare_action', 'ap_resolve_property_options', 'ap_resolve_property_chain', 'ap_discover_action_auth', 'ap_explore_data']
const ACTION_TOOLS = ['ap_execute_action', 'ap_explore_data']
const BREAKER_MARKER = '✋'
const AUTH_HINTS = ['connection', 'reconnect', 'authenticat', 'not authorized', 'unauthorized', '401', '403']
const HTTP_PIECE_HINT = 'piece-http'

// Reduce a conversation's persisted uiMessages into the failure-mode scorecard the plan calls
// for. Operates purely on the persisted tool-call/receipt parts (toolName, input, output,
// status) — no log-file dependency, so the same tagger works on a /state response or a
// recorded transcript.
function tag({ scenario, uiMessages }: { scenario: LiveScenario, uiMessages: unknown[] }): ScenarioScore {
    const calls = collectToolCalls(uiMessages)
    const receiptSuccess = hasSuccessfulReceipt(uiMessages)

    const workIndex = calls.findIndex((c) => WORK_TOOLS.includes(c.toolName))
    const reachedWork = workIndex >= 0
    const workSucceeded = receiptSuccess || calls.some((c) => WORK_TOOLS.includes(c.toolName) && isSuccess(c))
    const blockedOnConnection = !workSucceeded && calls.some((c) => CONNECTION_BLOCK_TOOLS.includes(c.toolName))
    const outcome: ScenarioOutcome = workSucceeded ? 'did-work' : (blockedOnConnection ? 'blocked-connection' : 'stuck')

    const rejections = calls.filter(isFailure)
    const badArgRejections = rejections.filter((c) => isBadArgFailure(c)).length
    const authBlocked = rejections.filter((c) => isAuthFailure(c)).length
    const otherErrors = rejections.length - badArgRejections - authBlocked

    return {
        scenarioId: scenario.id,
        shape: scenario.shape,
        targetPiece: scenario.targetPiece ?? null,
        totalToolCalls: calls.length,
        discoveryCalls: calls.filter((c) => DISCOVERY_TOOLS.includes(c.toolName)).length,
        hopsBeforeFirstExecute: reachedWork ? workIndex : null,
        executed: reachedWork,
        executeSucceeded: workSucceeded,
        outcome,
        blockedOnConnection,
        gaveUp: scenario.expectsExecution && outcome === 'stuck',
        badArgRejections,
        authBlocked,
        otherErrors,
        breakerHits: calls.filter((c) => c.outputText.includes(BREAKER_MARKER)).length,
        schemaRefetches: countSchemaRefetches(calls),
        rightInstrument: gradeRightInstrument({ scenario, calls }),
        nativeHandled: gradeNativeHandled({ scenario, calls }),
        toolSequence: calls.map((c) => c.toolName),
        finalReply: lastAssistantText(uiMessages),
    }
}

// Mastery dim 1/2: when the intent is to enumerate, the right instrument is a list_*/search_*
// action — reaching only for find_*/get_* (which return one match) is the Attio-thrash signature.
function gradeRightInstrument({ scenario, calls }: { scenario: LiveScenario, calls: ToolCall[] }): boolean | null {
    if (!scenario.expectEnumerate) return null
    const actionCalls = calls.filter((c) => ACTION_TOOLS.includes(c.toolName) && c.actionName.length > 0)
    if (actionCalls.length === 0) return null
    return actionCalls.some((c) => isEnumerateAction(c.actionName))
}

// Mastery dim 5: a native task (no piece) is handled by reaching the API over HTTP, or by code.
function gradeNativeHandled({ scenario, calls }: { scenario: LiveScenario, calls: ToolCall[] }): boolean | null {
    if (!scenario.native) return null
    if (scenario.native === 'code') {
        return calls.some((c) => c.toolName === CODE_TOOL)
    }
    return calls.some((c) => c.pieceName.includes(HTTP_PIECE_HINT) || c.toolName === CODE_TOOL || c.toolName === FETCH_TOOL)
}

function isEnumerateAction(actionName: string): boolean {
    const name = actionName.toLowerCase()
    return name.startsWith('list') || name.startsWith('search') || name.includes('_list') || name.includes('list_') || name.includes('search')
}

function aggregate({ scores }: { scores: ScenarioScore[] }): LiveScorecard {
    const n = scores.length || 1
    const executedScores = scores.filter((s) => s.executed)
    const sum = (pick: (s: ScenarioScore) => number): number => scores.reduce((acc, s) => acc + pick(s), 0)
    const avg = (pick: (s: ScenarioScore) => number): number => round(sum(pick) / n)

    return {
        scenarioCount: scores.length,
        executedCount: executedScores.length,
        succeededCount: scores.filter((s) => s.executeSucceeded).length,
        blockedOnConnectionCount: scores.filter((s) => s.outcome === 'blocked-connection').length,
        gaveUpCount: scores.filter((s) => s.gaveUp).length,
        avgToolCalls: avg((s) => s.totalToolCalls),
        avgDiscoveryCalls: avg((s) => s.discoveryCalls),
        avgHopsBeforeExecute: executedScores.length > 0
            ? round(executedScores.reduce((acc, s) => acc + (s.hopsBeforeFirstExecute ?? 0), 0) / executedScores.length)
            : null,
        totalBadArgRejections: sum((s) => s.badArgRejections),
        totalAuthBlocked: sum((s) => s.authBlocked),
        totalOtherErrors: sum((s) => s.otherErrors),
        totalBreakerHits: sum((s) => s.breakerHits),
        totalSchemaRefetches: sum((s) => s.schemaRefetches),
        wrongInstrumentCount: scores.filter((s) => s.rightInstrument === false).length,
        rightInstrumentGraded: scores.filter((s) => s.rightInstrument !== null).length,
        nativeHandledCount: scores.filter((s) => s.nativeHandled === true).length,
        nativeGraded: scores.filter((s) => s.nativeHandled !== null).length,
        scores,
    }
}

function collectToolCalls(uiMessages: unknown[]): ToolCall[] {
    const calls: ToolCall[] = []
    for (const message of uiMessages) {
        if (!isAssistant(message)) continue
        for (const part of partsOf(message)) {
            if (asString(part['type']) !== PersistedChatPartType.TOOL_CALL) continue
            const input = isRecord(part['input']) ? part['input'] : {}
            calls.push({
                toolName: asString(part['toolName']) ?? '',
                input,
                actionName: asString(input['actionName']) ?? '',
                pieceName: asString(input['pieceName']) ?? '',
                outputText: extractText(part['output']),
                errorText: asString(part['errorText']) ?? '',
                status: asString(part['status']) ?? '',
            })
        }
    }
    return calls
}

function hasSuccessfulReceipt(uiMessages: unknown[]): boolean {
    for (const message of uiMessages) {
        if (!isAssistant(message)) continue
        for (const part of partsOf(message)) {
            if (asString(part['type']) === PersistedChatPartType.ACTION_RECEIPT && part['status'] === 'success') {
                return true
            }
        }
    }
    return false
}

function countSchemaRefetches(calls: ToolCall[]): number {
    const seen = new Set<string>()
    let refetches = 0
    for (const call of calls) {
        if (!SCHEMA_TOOLS.includes(call.toolName)) continue
        const piece = asString(call.input['pieceName']) ?? ''
        const action = asString(call.input['actionOrTriggerName']) ?? ''
        const key = `${piece}::${action}`
        if (seen.has(key)) {
            refetches++
        }
        else {
            seen.add(key)
        }
    }
    return refetches
}

function isSuccess(call: ToolCall): boolean {
    // The loop-breaker returns a plain (non-error) result whose text starts with ✋, which
    // hasFailureTextPrefix (❌/⏳ only) does not catch — so exclude it explicitly, else a
    // short-circuited execute would be miscounted as a success.
    return call.status === PersistedToolCallStatus.COMPLETED
        && !chatToolClassification.hasFailureTextPrefix(call.outputText)
        && !call.outputText.includes(BREAKER_MARKER)
}

function isFailure(call: ToolCall): boolean {
    return call.status === PersistedToolCallStatus.ERROR || chatToolClassification.hasFailureTextPrefix(call.outputText)
}

function isAuthFailure(call: ToolCall): boolean {
    const haystack = `${call.outputText} ${call.errorText}`.toLowerCase()
    return AUTH_HINTS.some((hint) => haystack.includes(hint))
}

function isBadArgFailure(call: ToolCall): boolean {
    if (isAuthFailure(call)) return false
    const text = `${call.outputText} ${call.errorText}`
    return text.includes('Cannot run action') || text.includes('Unknown') || text.includes('not allowed') || text.includes('missing')
}

function lastAssistantText(uiMessages: unknown[]): string {
    let text = ''
    for (const message of uiMessages) {
        if (!isAssistant(message)) continue
        for (const part of partsOf(message)) {
            if (asString(part['type']) === PersistedChatPartType.TEXT) {
                text = asString(part['text']) ?? text
            }
        }
    }
    return text
}

function extractText(output: unknown): string {
    if (typeof output === 'string') return output
    if (!isRecord(output)) return ''
    if (typeof output['text'] === 'string') return output['text']
    if (Array.isArray(output['content'])) {
        return output['content'].map((p) => isRecord(p) && typeof p['text'] === 'string' ? p['text'] : '').join(' ')
    }
    if (output['value'] !== undefined) return extractText(output['value'])
    return ''
}

function isAssistant(message: unknown): message is Record<string, unknown> {
    return isRecord(message) && message['role'] === PersistedChatRole.ASSISTANT
}

function partsOf(message: Record<string, unknown>): Array<Record<string, unknown>> {
    const parts = message['parts']
    if (!Array.isArray(parts)) return []
    return parts.filter(isRecord)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}

function round(value: number): number {
    return Math.round(value * 100) / 100
}

export const liveTagger = {
    tag,
    aggregate,
}

export type ScenarioOutcome = 'did-work' | 'blocked-connection' | 'stuck'

type ToolCall = {
    toolName: string
    input: Record<string, unknown>
    actionName: string
    pieceName: string
    outputText: string
    errorText: string
    status: string
}

export type ScenarioScore = {
    scenarioId: string
    shape: string
    targetPiece: string | null
    totalToolCalls: number
    discoveryCalls: number
    hopsBeforeFirstExecute: number | null
    executed: boolean
    executeSucceeded: boolean
    outcome: ScenarioOutcome
    blockedOnConnection: boolean
    gaveUp: boolean
    badArgRejections: number
    authBlocked: number
    otherErrors: number
    breakerHits: number
    schemaRefetches: number
    rightInstrument: boolean | null
    nativeHandled: boolean | null
    toolSequence: string[]
    finalReply: string
}

export type LiveScorecard = {
    scenarioCount: number
    executedCount: number
    succeededCount: number
    blockedOnConnectionCount: number
    gaveUpCount: number
    avgToolCalls: number
    avgDiscoveryCalls: number
    avgHopsBeforeExecute: number | null
    totalBadArgRejections: number
    totalAuthBlocked: number
    totalOtherErrors: number
    totalBreakerHits: number
    totalSchemaRefetches: number
    wrongInstrumentCount: number
    rightInstrumentGraded: number
    nativeHandledCount: number
    nativeGraded: number
    scores: ScenarioScore[]
}
