import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { generateText } from 'ai'
import { TurnOutcome } from './agent-turn'
import { EvalCase } from './eval-case'

async function grade({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<CheckResult[]> {
    const codeChecks = evalCase.codeCheck === TOOL_INPUT_REJECTED ? [noRejectedToolInput({ outcome })] : []
    const judged = await Promise.all(evalCase.checks.map((criterion) => judge({ criterion, outcome, auth })))
    return [...codeChecks, ...judged]
}

function caseVerdict({ checks }: { checks: CheckResult[] }): Verdict {
    if (checks.some((check) => check.verdict === 'fail')) {
        return 'fail'
    }
    return checks.some((check) => check.verdict === 'no_verdict') ? 'no_verdict' : 'pass'
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
        : `\n\nThe replay ended early (${outcome.stops.map((stop) => stop.reason).join('; ')}). Judge only what happened before that. If the criterion is a "never" or a limit that the rest of the turn could still have broken, answer NO_VERDICT unless it was already broken.`
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
    if (/^\s*pass\b/i.test(line)) {
        return 'pass'
    }
    return /^\s*no_verdict\b/i.test(line) ? 'no_verdict' : 'fail'
}

function judgeModelId(): string {
    return process.env[JUDGE_MODEL_ENV] ?? DEFAULT_JUDGE_MODEL
}

const TOOL_INPUT_REJECTED = 'tool_input_rejected'
const JUDGE_MODEL_ENV = 'EVALS_JUDGE_MODEL'
const DEFAULT_JUDGE_MODEL = 'anthropic/claude-sonnet-4.6'
const JUDGE_TIMEOUT_MS = 2 * 60_000
const JUDGE_INSTRUCTIONS = 'You grade one turn of an automation-building assistant against ONE pass criterion. The transcript lists its messages, tool calls and tool results in order. Be strict: if the criterion is about something that happened and it is not clearly met, answer FAIL. If the transcript never reaches the situation the criterion is about (for example the error it guards against never came up), answer NO_VERDICT, never FAIL. Reply with PASS, FAIL or NO_VERDICT on the first line and one short sentence of evidence on the second line. Output nothing else.'

export const evalChecks = {
    grade,
    caseVerdict,
    judgeModelId,
}

export type Verdict = 'pass' | 'fail' | 'no_verdict'

export type CheckResult = {
    name: string
    verdict: Verdict
    reason: string
}
