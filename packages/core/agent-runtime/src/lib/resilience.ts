import { isObject, tryCatchSync } from '@activepieces/core-utils'
import { createHash } from 'node:crypto'
import { ToolCallOptions, ToolSet } from 'ai'

export function decideLoopAction({ finishReason, producedVisibleOutput, continuations, emptyContinuations }: {
    finishReason: string
    producedVisibleOutput: boolean
    continuations: number
    emptyContinuations: number
}): LoopDecision {
    if (finishReason === 'length') {
        return continuations >= MAX_AUTO_CONTINUATIONS ? 'finish' : 'continue_truncation'
    }
    if (!producedVisibleOutput && emptyContinuations < MAX_EMPTY_CONTINUATIONS) {
        return 'continue_empty'
    }
    return 'finish'
}

export function shouldRetryStream({ producedVisibleOutput, streamRetries }: {
    producedVisibleOutput: boolean
    streamRetries: number
}): boolean {
    return !producedVisibleOutput && streamRetries < MAX_STREAM_RETRIES
}

export function isTransientFailureText(text: string): boolean {
    return /\b(429|5\d\d)\b|rate.?limit|timeout|timed out|temporarily|try again|econnreset|etimedout|socket hang up|service unavailable/i.test(text)
}

export function looksEmptyResultText(text: string): boolean {
    return /"found"\s*:\s*false|\bempty result\b|no results matched|"result"\s*:\s*\[\s*\]|"results"\s*:\s*\[\s*\]/i.test(text)
}

export function extractResultText(result: unknown): string {
    if (typeof result === 'string') {
        return result
    }
    if (!isObject(result)) {
        return ''
    }
    if (typeof result['text'] === 'string') {
        return result['text']
    }
    if (Array.isArray(result['content'])) {
        return result['content'].map((part) => isObject(part) && typeof part['text'] === 'string' ? part['text'] : '').join(' ')
    }
    if (isObject(result['value'])) {
        return extractResultText(result['value'])
    }
    return ''
}

/**
 * Tool results reach the breaker in two shapes: a structured `ExecuteToolResponse`
 * (`{ status: 'FAILED', errorMessage }`) from piece/flow tools, and free text from MCP tools.
 * Checking the structured field first matters — a text-only check never fires for piece tools,
 * because their object carries no `text`/`content` for `extractResultText` to read.
 */
export function isFailureResult(result: unknown): boolean {
    if (isObject(result)) {
        if (result['status'] === 'FAILED' || result['isError'] === true) {
            return true
        }
    }
    return hasFailureMarker(extractResultText(result))
}

export function hasFailureMarker(text: string): boolean {
    return /^\s*(❌|⏳|error\b|failed\b)|"status"\s*:\s*"FAILED"/i.test(scanHead(text))
}

/**
 * Centralized loop-breaker: an identical (tool + input) call that already failed
 * MAX_IDENTICAL_TOOL_FAILURES times is short-circuited with a directive to change approach,
 * instead of letting the model re-fire the same failing call indefinitely.
 */
export function wrapToolsWithFailureGuard({ tools, isFailure = isFailureResult, log }: {
    tools: ToolSet
    isFailure?: (result: unknown) => boolean
    log: { warn: (obj: Record<string, unknown>, msg: string) => void }
}): ToolSet {
    const failureCounts = new Map<string, number>()
    const guarded: ToolSet = {}
    for (const [name, toolDef] of Object.entries(tools)) {
        const originalExecute = toolDef.execute
        if (typeof originalExecute !== 'function') {
            guarded[name] = toolDef
            continue
        }
        guarded[name] = {
            ...toolDef,
            execute: async (input: unknown, options: ToolCallOptions) => {
                const key = `${name}::${fingerprintInput(input)}`
                if ((failureCounts.get(key) ?? 0) >= MAX_IDENTICAL_TOOL_FAILURES) {
                    log.warn({ tool: { name } }, 'Short-circuited repeated unproductive tool call')
                    return { content: [{ type: 'text', text: `✋ This exact ${name} call already came back the same unproductive way ${MAX_IDENTICAL_TOOL_FAILURES} times (an error, or an empty result) and was NOT retried. Stop repeating it: change the parameters, switch the action (e.g. a list/search action instead of a find-one), or try a different approach. Do not re-send the identical call.` }] }
                }
                const result = await originalExecute(input, options)
                const head = scanHead(extractResultText(result))
                const failed = isFailure(result)
                const emptyRead = !failed && head.length > 0 && looksEmptyResultText(head)
                // Transient errors (429/5xx/timeout) are exempt: retrying those can legitimately succeed.
                const transient = failed && isTransientFailureText(head)
                if ((failed && !transient) || emptyRead) {
                    failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1)
                }
                else {
                    failureCounts.delete(key)
                }
                return result
            },
        }
    }
    return guarded
}

export function delayWithJitter(baseMs: number): Promise<void> {
    const jitter = Math.random() * 0.5 + 0.75
    return new Promise((resolve) => setTimeout(resolve, baseMs * jitter))
}

// Failure and empty-result markers sit at the head of a payload, so a bounded slice is enough —
// and keeps a multi-hundred-KB tool result from being regex-scanned three times per call.
function scanHead(text: string): string {
    return text.slice(0, SCAN_HEAD_CHARS)
}

// Hashed so the map holds constant-size keys instead of retaining the full input JSON of every
// distinct call for the lifetime of the turn.
function fingerprintInput(input: unknown): string {
    const { data } = tryCatchSync(() => JSON.stringify(input))
    return createHash('sha1').update(data ?? '').digest('hex')
}

export const MAX_AGENT_STEPS = 50
export const IN_LOOP_COMPACTION_THRESHOLD = 0.6
export const RUNAWAY_TURN_CONTEXT_MULTIPLE = 90
export const STREAM_RETRY_BASE_DELAY_MS = 1_000

const MAX_AUTO_CONTINUATIONS = 3
const MAX_EMPTY_CONTINUATIONS = 2
const MAX_STREAM_RETRIES = 1
const MAX_IDENTICAL_TOOL_FAILURES = 2
const SCAN_HEAD_CHARS = 2_000

export const CONTINUE_NUDGE = '[system note — not from the user] Your previous response was cut off by the output token limit before it finished. Continue exactly where you stopped. If a tool call was cut off, re-issue it in FULL. Do not repeat content you already produced.'

export const EMPTY_OUTPUT_NUDGE = '[system note — not from the user] Your previous step produced no visible reply to the user. Continue the task now: either call the next tool, or write your reply to the user. Do not stop silently.'

export type LoopDecision = 'finish' | 'continue_truncation' | 'continue_empty'
