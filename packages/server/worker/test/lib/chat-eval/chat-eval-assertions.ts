import { Assertion, ToolCallRecord, Transcript } from './chat-eval-types'

function indexOfFirstCall(transcript: Transcript, toolName: string): number {
    return transcript.toolCalls.findIndex((c) => c.toolName === toolName)
}

function allText(transcript: Transcript): string {
    return transcript.assistantTexts.map((t) => t.text).join('\n').toLowerCase()
}

const COLUMN_QUESTION_PATTERNS = [
    /what (?:are the |)columns/,
    /column names/,
    /which columns/,
    /describe (?:the |your )?(?:data|sheet|columns)/,
    /list (?:the |your )?columns/,
    /what (?:data )?(?:do you have|fields)/,
]

const HOW_QUESTION_PATTERNS = [
    /how (?:should|do|would) (?:i|we|you) (?:build|wire|set ?up|configure|connect)/,
    /which (?:trigger|action|piece|field|step type)/,
]

const CUT_OFF_PATTERNS = [/got cut off/, /message (?:was |got |seems )?cut/, /seems? incomplete/]

/** The agent called a given tool at least once. */
function calledTool(toolName: string): Assertion {
    return (t) => ({
        name: `called ${toolName}`,
        passed: indexOfFirstCall(t, toolName) !== -1,
        detail: `tools: ${t.toolCalls.map((c) => c.toolName).join(', ')}`,
    })
}

/** The agent never called a given tool. */
function neverCalledTool(toolName: string): Assertion {
    return (t) => ({
        name: `never called ${toolName}`,
        passed: indexOfFirstCall(t, toolName) === -1,
    })
}

/** Tool A was first called before tool B was first called. */
function calledBefore(before: string, after: string): Assertion {
    return (t) => {
        const a = indexOfFirstCall(t, before)
        const b = indexOfFirstCall(t, after)
        const passed = a !== -1 && (b === -1 || a < b)
        return { name: `${before} before ${after}`, passed, detail: `${before}@${a}, ${after}@${b}` }
    }
}

/** No build-only tool was called before the agent entered the build phase. */
function noBuildToolBeforePhaseSet(isBuildOnly: (name: string) => boolean): Assertion {
    return (t) => {
        const phaseIdx = t.toolCalls.findIndex(
            (c) => c.toolName === 'ap_set_phase' && c.input?.phase === 'build',
        )
        const offenders = t.toolCalls.filter(
            (c, i) => isBuildOnly(c.toolName) && (phaseIdx === -1 || i < phaseIdx),
        )
        return {
            name: 'no build tool before build phase',
            passed: offenders.length === 0,
            detail: offenders.map((c) => c.toolName).join(', '),
        }
    }
}

/** The agent never asked the user to describe/list columns or data shape. */
const neverAskedForColumns: Assertion = (t) => {
    const text = allText(t)
    const hit = COLUMN_QUESTION_PATTERNS.find((p) => p.test(text))
    return { name: 'never asked for columns/data shape', passed: !hit, detail: hit?.source }
}

/** The agent never asked a "how to build" / technical question. */
const neverAskedHow: Assertion = (t) => {
    const text = allText(t)
    const hit = HOW_QUESTION_PATTERNS.find((p) => p.test(text))
    return { name: 'never asked how/technical', passed: !hit, detail: hit?.source }
}

/** The agent never claimed the user's message was cut off. */
const neverClaimedCutOff: Assertion = (t) => {
    const text = allText(t)
    const hit = CUT_OFF_PATTERNS.find((p) => p.test(text))
    return { name: 'never claimed message cut off', passed: !hit, detail: hit?.source }
}

/** A display tool of the given name appeared within N turns. */
function reachedToolWithin(toolName: string, maxTurn: number): Assertion {
    return (t) => {
        const call = t.toolCalls.find((c) => c.toolName === toolName)
        const passed = call !== undefined && call.turn <= maxTurn
        return { name: `reached ${toolName} within ${maxTurn} turns`, passed, detail: call ? `turn ${call.turn}` : 'never' }
    }
}

/** The agent asked at most N questions via the ap_show_questions card. */
function maxQuestionCards(max: number): Assertion {
    return (t) => {
        const n = t.toolCalls.filter((c) => c.toolName === 'ap_show_questions').length
        return { name: `≤${max} question cards`, passed: n <= max, detail: `${n} cards` }
    }
}

/** Custom predicate over the recorded tool calls. */
function custom(name: string, predicate: (calls: ToolCallRecord[]) => boolean): Assertion {
    return (t) => ({ name, passed: predicate(t.toolCalls) })
}

export const chatEvalAssertions = {
    calledTool,
    neverCalledTool,
    calledBefore,
    noBuildToolBeforePhaseSet,
    neverAskedForColumns,
    neverAskedHow,
    neverClaimedCutOff,
    reachedToolWithin,
    maxQuestionCards,
    custom,
}
