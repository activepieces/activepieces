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

function noRejectedToolInput({ outcome }: { outcome: TurnOutcome }): CheckResult {
    const rejected = outcome.rejectedToolInputs
    return {
        name: 'no rejected tool input',
        pass: rejected.length === 0,
        reason: rejected.length === 0 ? 'Every tool call passed validation' : `${rejected.length} rejected: ${rejected.join(' | ')}`,
    }
}

async function judge({ criterion, outcome, auth }: { criterion: string, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<CheckResult> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: judgeModelId(), billing: null })
    const replayNote = outcome.divergences.length === 0
        ? ''
        : `\n\nThe replay ended early because the assistant left the recorded path (${outcome.divergences.map((divergence) => divergence.reason).join('; ')}). Judge only what happened before that.`
    const { text } = await generateText({
        model,
        temperature: 0,
        abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
        instructions: JUDGE_INSTRUCTIONS,
        prompt: `Pass criterion: ${criterion}${replayNote}\n\n--- TRANSCRIPT START ---\n${outcome.transcript}\n--- TRANSCRIPT END ---`,
    })
    const [verdict = '', ...rest] = text.trim().split('\n')
    return { name: criterion, pass: /^\s*pass\b/i.test(verdict), reason: rest.join(' ').trim() || verdict.trim() }
}

function judgeModelId(): string {
    return process.env[JUDGE_MODEL_ENV] ?? DEFAULT_JUDGE_MODEL
}

const TOOL_INPUT_REJECTED = 'tool_input_rejected'
const JUDGE_MODEL_ENV = 'EVALS_JUDGE_MODEL'
const DEFAULT_JUDGE_MODEL = 'anthropic/claude-sonnet-4.6'
const JUDGE_TIMEOUT_MS = 2 * 60_000
const JUDGE_INSTRUCTIONS = 'You grade one turn of an automation-building assistant against ONE pass criterion. The transcript lists its messages, tool calls and tool results in order. Be strict: if the criterion is not clearly met, answer FAIL. Reply with PASS or FAIL on the first line and one short sentence of evidence on the second line. Output nothing else.'

export const evalChecks = {
    grade,
    judgeModelId,
}

export type CheckResult = {
    name: string
    pass: boolean
    reason: string
}
