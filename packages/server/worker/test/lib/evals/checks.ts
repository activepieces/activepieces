import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { generateText } from 'ai'
import { TurnOutcome } from './agent-turn'
import { EvalCase } from './eval-case'

async function grade({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<CheckResult[]> {
    if (outcome.stops.length > 0 && !outcome.reachedTarget) {
        return [{ name: REPLAY_CHECK_NAME, verdict: 'fail', reason: `replay stopped before the tested step: ${outcome.stops.map((stop) => stop.reason).join('; ')}` }]
    }
    const codeChecks = evalCase.codeCheck === TOOL_INPUT_REJECTED ? [noRejectedToolInput({ outcome })] : []
    const judged = await Promise.all(evalCase.checks.map((criterion) => judge({ criterion, outcome, auth })))
    return [...codeChecks, ...judged]
}

function caseVerdict({ checks }: { checks: CheckResult[] }): Verdict {
    return checks.some((check) => check.verdict === 'fail') ? 'fail' : 'pass'
}

function noRejectedToolInput({ outcome }: { outcome: TurnOutcome }): CheckResult {
    const rejected = outcome.rejectedToolInputs
    return {
        name: 'no rejected tool input',
        verdict: rejected.length === 0 ? 'pass' : 'fail',
        reason: rejected.length === 0 ? 'Every tool call passed validation' : `${rejected.length} rejected: ${rejected.join(' | ')}`,
    }
}

async function judge({ criterion, outcome, auth }: { criterion: string, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<CheckResult> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: judgeModelId(), billing: null })
    const replayNote = outcome.stops.length === 0
        ? ''
        : `\n\nThe replay ended early (${outcome.stops.map((stop) => stop.reason).join('; ')}). Judge only what happened before that.`
    const { text } = await generateText({
        model,
        temperature: 0,
        abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
        instructions: JUDGE_INSTRUCTIONS,
        prompt: `Pass criterion: ${criterion}${replayNote}\n\n--- TRANSCRIPT START ---\n${outcome.transcript}\n--- TRANSCRIPT END ---`,
    })
    const [firstLine = '', ...rest] = text.trim().split('\n')
    return { name: criterion, verdict: parseVerdict({ line: firstLine }), reason: rest.join(' ').trim() || firstLine.trim() }
}

function parseVerdict({ line }: { line: string }): Verdict {
    return /^\s*pass\b/i.test(line) ? 'pass' : 'fail'
}

function judgeModelId(): string {
    return process.env[JUDGE_MODEL_ENV] ?? DEFAULT_JUDGE_MODEL
}

const TOOL_INPUT_REJECTED = 'tool_input_rejected'
const REPLAY_CHECK_NAME = 'replay reached the tested step'
const JUDGE_MODEL_ENV = 'EVALS_JUDGE_MODEL'
const DEFAULT_JUDGE_MODEL = 'anthropic/claude-sonnet-4.6'
const JUDGE_TIMEOUT_MS = 2 * 60_000
const JUDGE_INSTRUCTIONS = 'You grade one turn of an automation-building assistant against ONE pass criterion. The transcript lists its messages, tool calls and tool results in order. Be strict: if the criterion is about something that happened and it is not clearly met, answer FAIL. If the transcript never reaches the situation the criterion is about (for example the error it guards against never came up), the mistake did not happen, so answer PASS. Reply with PASS or FAIL on the first line and one short sentence of evidence on the second line. Output nothing else.'

export const evalChecks = {
    grade,
    caseVerdict,
    judgeModelId,
}

export type Verdict = 'pass' | 'fail'

export type CheckResult = {
    name: string
    verdict: Verdict
    reason: string
}
