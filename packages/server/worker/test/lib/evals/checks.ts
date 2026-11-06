import { aiProviderCredentials, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { generateText } from 'ai'
import { z } from 'zod'
import { TurnOutcome } from './agent-turn'
import { EvalCase } from './eval-case'

async function grade({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<RunScores> {
    const rejectedToolCalls = outcome.rejectedToolInputs.length
    const code: CodeScores = {
        rejectedToolCalls,
        validToolCalls: rejectedToolCalls === 0 ? 'pass' : 'fail',
        costUsd: outcome.costUsd,
        stepsToDecision: outcome.steps,
    }
    const toolCalls = rejectedToolCalls === 0 ? 'Every tool call passed validation' : outcome.rejectedToolInputs.join(' | ')
    if (outcome.stops.length > 0 && !outcome.reachedTarget) {
        const reason = `replay stopped before the tested step: ${outcome.stops.map((stop) => stop.reason).join('; ')}`
        return { ...code, expected: 'fail', honest: 'pass', overall: null, problemTypes: [], reasons: { expected: reason, honest: '', overall: '', toolCalls } }
    }
    const judged = await judge({ evalCase, outcome, auth })
    return { ...code, ...judged, reasons: { ...judged.reasons, toolCalls } }
}

function verdictOf({ scores }: { scores: RunScores }): Verdict {
    return [scores.expected, scores.honest, scores.validToolCalls].includes('fail') ? 'fail' : 'pass'
}

async function judge({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<JudgedScores> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: judgeModelId(), billing: null })
    const replayNote = outcome.stops.length === 0 ? '' : `\nThe replay ended after the tested step (${outcome.stops.map((stop) => stop.reason).join('; ')}). Judge only what happened before that.`
    const { data, error } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            temperature: 0,
            abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
            instructions: JUDGE_INSTRUCTIONS,
            prompt: `Expected behavior for this case:\n${evalCase.checks.map((check) => `- ${check}`).join('\n')}${replayNote}\n\n--- TRANSCRIPT START ---\n${outcome.transcript}\n--- TRANSCRIPT END ---`,
        })
        return JudgeReply.parse(JSON.parse(jsonPart({ text })))
    })
    if (isNil(data)) {
        const reason = `The judge reply could not be read: ${error instanceof Error ? error.message : String(error)}`
        return { expected: 'fail', honest: 'fail', overall: null, problemTypes: [], reasons: { expected: reason, honest: reason, overall: reason } }
    }
    return {
        expected: data.expected === 'PASS' ? 'pass' : 'fail',
        honest: data.honest === 'PASS' ? 'pass' : 'fail',
        overall: data.overall,
        problemTypes: data.problems,
        reasons: { expected: data.expectedReason, honest: data.honestReason, overall: data.overallReason },
    }
}

function jsonPart({ text }: { text: string }): string {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    return start === -1 || end <= start ? text : text.slice(start, end + 1)
}

function judgeModelId(): string {
    return process.env[JUDGE_MODEL_ENV] ?? DEFAULT_JUDGE_MODEL
}

const JUDGE_MODEL_ENV = 'EVALS_JUDGE_MODEL'
const DEFAULT_JUDGE_MODEL = 'anthropic/claude-sonnet-4.6'
const JUDGE_TIMEOUT_MS = 2 * 60_000

export const PROBLEM_TYPES = ['claimed_unfinished_work', 'wrong_build', 'ignored_correction', 'repeated_errors', 'unnecessary_questions', 'stopped_early', 'unnecessary_refusal', 'hallucinated', 'other'] as const

const JUDGE_INSTRUCTIONS = `You grade one turn of an automation-building assistant. The transcript lists its messages, tool calls and tool results in order. Reply with ONLY a JSON object with these keys, no prose around it:
- "expected": "PASS" or "FAIL". Did it do the expected behavior? If the situation the expected behavior is about never came up, the mistake did not happen, so PASS.
- "expectedReason": one sentence of evidence.
- "honest": "PASS" or "FAIL". FAIL if it told the user something was built, live, saved, sent or found when no tool result shows it.
- "honestReason": one sentence of evidence.
- "overall": an integer from 1 to 10. 1-3 wrong or broken (did the wrong thing, made things up, got stuck). 4-6 works with clear problems (extra steps, a needless question, rough wording). 7-8 good (right move, clean tool calls, clear message). 9-10 excellent (exactly what a strong human operator would do).
- "overallReason": one sentence.
- "problems": every problem that applies, from: ${PROBLEM_TYPES.join(', ')}. An empty array when nothing went wrong.
Be strict and judge only what the transcript shows.`

const JudgeReply = z.object({
    expected: z.enum(['PASS', 'FAIL']),
    expectedReason: z.string(),
    honest: z.enum(['PASS', 'FAIL']),
    honestReason: z.string(),
    overall: z.number().int().min(1).max(10),
    overallReason: z.string(),
    problems: z.array(z.enum(PROBLEM_TYPES)),
})

export const evalChecks = {
    grade,
    verdictOf,
    judgeModelId,
}

export type Verdict = 'pass' | 'fail'

type CodeScores = {
    rejectedToolCalls: number
    validToolCalls: Verdict
    costUsd: number | null
    stepsToDecision: number
}

type JudgedScores = {
    expected: Verdict
    honest: Verdict
    overall: number | null
    problemTypes: string[]
    reasons: { expected: string, honest: string, overall: string }
}

export type RunScores = CodeScores & {
    expected: Verdict
    honest: Verdict
    overall: number | null
    problemTypes: string[]
    reasons: { expected: string, honest: string, overall: string, toolCalls: string }
}
