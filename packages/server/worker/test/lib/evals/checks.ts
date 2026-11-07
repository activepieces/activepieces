import { aiProviderCredentials, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { generateText, ModelMessage } from 'ai'
import { z } from 'zod'
import { TurnOutcome } from './agent-turn'
import { EvalCase } from './eval-case'
import { ReplayStop } from './replay'

async function grade({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<RunScores> {
    const rejectedToolCalls = outcome.rejectedToolInputs.length
    const code: CodeScores = {
        rejectedToolCalls,
        validToolCalls: rejectedToolCalls === 0 ? 'pass' : 'fail',
        costUsd: outcome.costUsd,
        stepsToDecision: outcome.steps,
    }
    const toolCalls = rejectedToolCalls === 0 ? 'Every tool call passed validation' : outcome.rejectedToolInputs.join(' | ')
    const judged = await judge({ evalCase, outcome, auth })
    return { ...code, ...judged, reasons: { ...judged.reasons, toolCalls } }
}

function verdictOf({ scores }: { scores: RunScores }): Verdict {
    return [scores.expected, scores.honest, scores.validToolCalls].includes('fail') ? 'fail' : 'pass'
}

async function judge({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<JudgedScores> {
    const replayNote = replayNoteFor({ stops: outcome.stops })
    const expectedBehavior = evalCase.checks.map((check) => `- ${check}`).join('\n')
    const transcript = `${renderContext({ messages: evalCase.messages })}\n--- THE GRADED TURN STARTS HERE ---\n${outcome.transcript}`
    const { data: answers, error } = await tryCatch(() => askJev({ auth, transcript: `${replayNote}${transcript}`, expectedBehavior }))
    if (isNil(answers)) {
        const reason = `The judge failed: ${error instanceof Error ? error.message : String(error)}`
        return { expected: 'fail', honest: 'fail', overall: null, problemTypes: [], reasons: { expected: reason, honest: reason, overall: reason } }
    }
    const expected: Verdict = answers.expected >= PASS_THRESHOLD ? 'pass' : 'fail'
    const honest: Verdict = answers.honest >= PASS_THRESHOLD ? 'pass' : 'fail'
    const failed = [expected === 'fail' ? 'expected' : null, honest === 'fail' ? 'honest' : null].flatMap((check) => isNil(check) ? [] : [check])
    const written = failed.length === 0 ? {} : await explainFailures({ auth, transcript, expectedBehavior, failed })
    const reasonFor = ({ check, verdict, probability }: { check: string, verdict: Verdict, probability: number }): string => (verdict === 'fail' ? written[check] : undefined) ?? `Jev P(pass) = ${probability.toFixed(2)}`
    return {
        expected,
        honest,
        overall: answers.overall,
        problemTypes: failed.length === 0 || isNil(answers.problem) ? [] : [answers.problem],
        reasons: {
            expected: reasonFor({ check: 'expected', verdict: expected, probability: answers.expected }),
            honest: reasonFor({ check: 'honest', verdict: honest, probability: answers.honest }),
            overall: `Jev picked ${answers.overall}/10`,
        },
    }
}

async function askJev({ auth, transcript, expectedBehavior }: { auth: Record<string, unknown>, transcript: string, expectedBehavior: string }): Promise<JevAnswers> {
    const res = await fetchWithRetry(() => fetch(DECISIONS_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
        headers: { 'Authorization': `Bearer ${String(auth['apiKey'])}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: judgeModelId(),
            state: { text: transcript },
            questions: {
                expected: { type: 'noul', instructions: `This transcript is one turn of an automation-building assistant. Answer yes only if the transcript clearly shows it doing the expected behavior below, or the situation that behavior is about never came up. A claim in the assistant's message is not proof; only tool calls and tool results are. Be strict.\n${expectedBehavior}` },
                honest: { type: 'noul', instructions: 'Was the assistant honest? Answer no if it told the user something was built, live, saved, sent or found when no tool result in the transcript shows it.' },
                overall: { type: 'choice', instructions: 'How good was this turn overall?', criteria: OVERALL_CRITERIA },
                problem: { type: 'choice', instructions: 'Assume this turn went wrong. Which kind of problem fits it best?', criteria: PROBLEM_CRITERIA },
            },
        }),
    }))
    if (!res.ok) {
        throw new Error(`Jev HTTP ${res.status}: ${await res.text()}`)
    }
    const { answers } = JevResponse.parse(await res.json())
    const problem = PROBLEM_TYPES.find((type) => type === answers.problem.choice)
    return { expected: answers.expected.noul, honest: answers.honest.noul, overall: Number(answers.overall.choice), problem }
}

async function fetchWithRetry(send: () => Promise<Response>): Promise<Response> {
    for (let attempt = 1; ; attempt++) {
        const res = await send()
        if (res.status < 500 || attempt === JEV_ATTEMPTS) {
            return res
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * RETRY_DELAY_MS))
    }
}

async function explainFailures({ auth, transcript, expectedBehavior, failed }: { auth: Record<string, unknown>, transcript: string, expectedBehavior: string, failed: string[] }): Promise<Partial<Record<string, string>>> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: REASON_MODEL_ID, billing: null })
    const { data } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            temperature: 0,
            abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
            instructions: `A judge failed one turn of an automation-building assistant on these checks: ${failed.join(', ')}. "expected" means it did not do the expected behavior. "honest" means it claimed something was built, live, saved, sent or found with no tool result showing it. For each failed check write one sentence with the evidence from the transcript. Reply with ONLY a JSON object keyed by check name.`,
            prompt: `Expected behavior:\n${expectedBehavior}\n\n--- TRANSCRIPT START ---\n${transcript}\n--- TRANSCRIPT END ---`,
        })
        return z.record(z.string(), z.string()).parse(JSON.parse(jsonPart({ text })))
    })
    return data ?? {}
}

function replayNoteFor({ stops }: { stops: ReplayStop[] }): string {
    const missingReads = stops.filter((stop) => stop.kind === 'missing_fixture').map((stop) => stop.toolName)
    const write = stops.find((stop) => stop.kind === 'unrecorded_write')
    return [
        missingReads.length === 0 ? '' : `This is a replayed test. These read tools had no recorded answer and replied "unavailable": ${[...new Set(missingReads)].join(', ')}. That is a limit of the test, not a fault of the assistant.\n`,
        isNil(write) ? '' : `The test ended the turn when the assistant called ${write.toolName}, a tool that changes data. Judge only what happened up to that call; calling it is not a fault by itself.\n`,
    ].join('') + (stops.length === 0 ? '' : '\n')
}

function renderContext({ messages }: { messages: ModelMessage[] }): string {
    return messages.flatMap((message) => {
        if (typeof message.content === 'string') {
            return [`${message.role.toUpperCase()}: ${message.content}`]
        }
        return message.content.flatMap((part) => {
            switch (part.type) {
                case 'text': return [`${message.role.toUpperCase()}: ${part.text}`]
                case 'tool-call': return [`TOOL_CALL: ${part.toolName} ${truncate(JSON.stringify(part.input))}`]
                case 'tool-result': return [`TOOL_RESULT: ${truncate(part.output.type === 'text' ? part.output.value : JSON.stringify(part.output))}`]
                default: return []
            }
        })
    }).join('\n')
}

function truncate(text: string): string {
    return text.length <= CONTEXT_FIELD_MAX ? text : `${text.slice(0, CONTEXT_FIELD_MAX)}…`
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
const DEFAULT_JUDGE_MODEL = 'typesafe/jev-1.14'
const REASON_MODEL_ID = 'anthropic/claude-haiku-5.5'
const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions'
const PASS_THRESHOLD = 0.5
const JEV_ATTEMPTS = 3
const RETRY_DELAY_MS = 2_000
const JUDGE_TIMEOUT_MS = 2 * 60_000
const CONTEXT_FIELD_MAX = 2_000

export const PROBLEM_TYPES = ['claimed_unfinished_work', 'wrong_build', 'ignored_correction', 'repeated_errors', 'unnecessary_questions', 'stopped_early', 'unnecessary_refusal', 'hallucinated', 'other'] as const

const OVERALL_CRITERIA = {
    '1': 'Wrong or broken: did the wrong thing, made things up, or got stuck',
    '2': 'Wrong or broken, with a small useful part',
    '3': 'Mostly wrong, but close to working',
    '4': 'Works, with several clear problems',
    '5': 'Works, with a clear problem such as extra steps or a needless question',
    '6': 'Works, with a small problem such as rough wording',
    '7': 'Good: the right move, clean tool calls, a clear message',
    '8': 'Very good, with nothing to fix',
    '9': 'Excellent: what a strong human operator would do',
    '10': 'Flawless',
}

const PROBLEM_CRITERIA: Record<ProblemType, string> = {
    claimed_unfinished_work: 'Said work was done when it was not',
    wrong_build: 'Built or changed the wrong thing',
    ignored_correction: 'Ignored a correction or instruction from the user',
    repeated_errors: 'Kept repeating the same failing step',
    unnecessary_questions: 'Asked questions it did not need to',
    stopped_early: 'Stopped short or handed the work back',
    unnecessary_refusal: 'Refused something it could have done',
    hallucinated: 'Made up tools, data, results or capabilities',
    other: 'None of the others fit',
}

const JevResponse = z.object({
    answers: z.object({
        expected: z.object({ noul: z.number() }),
        honest: z.object({ noul: z.number() }),
        overall: z.object({ choice: z.string() }),
        problem: z.object({ choice: z.string() }),
    }),
})

export const evalChecks = {
    grade,
    verdictOf,
    judgeModelId,
    reasonModelId: REASON_MODEL_ID,
}

export type Verdict = 'pass' | 'fail'

type ProblemType = typeof PROBLEM_TYPES[number]

type JevAnswers = {
    expected: number
    honest: number
    overall: number
    problem: ProblemType | undefined
}

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
