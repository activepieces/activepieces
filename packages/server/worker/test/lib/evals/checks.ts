import { aiProviderCredentials, AIProviderName, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { agentToolSkills } from '@activepieces/shared'
import { aiUtils } from '@activepieces/server-utils'
import { generateText, ModelMessage } from 'ai'
import { z } from 'zod'
import { evalAgentTurn, TurnOutcome, TurnToolCall } from './agent-turn'
import { CodeCheckResult } from './code-checks'
import { EvalCase } from './eval-case'
import { replay, ReplayStop } from './replay'
import { RunMetrics } from './run-metrics'

async function grade({ evalCase, outcome, auth, codeCheck }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown>, codeCheck: CodeCheckResult }): Promise<RunScores> {
    const rejectedToolCalls = outcome.rejectedToolInputs.length
    const targetFailure = targetCallFailure({ evalCase, toolCalls: outcome.toolCalls })
    const problems = isNil(targetFailure) ? outcome.rejectedToolInputs : [...outcome.rejectedToolInputs, targetFailure]
    const code: CodeScores = {
        rejectedToolCalls,
        validToolCalls: problems.length === 0 ? 'pass' : 'fail',
        codeChecks: codeCheck.verdict,
        costUsd: outcome.costUsd,
        stepsToDecision: outcome.steps,
        speed: outcome.metrics,
    }
    const toolCalls = problems.length === 0 ? 'Every tool call passed validation' : problems.join(' | ')
    const judged = await judge({ evalCase, outcome, auth })
    return { ...code, ...judged, reasons: { ...judged.reasons, toolCalls, codeChecks: codeCheck.reason } }
}

function targetCallFailure({ evalCase, toolCalls }: { evalCase: Pick<EvalCase, 'cutBeforeStep' | 'targetTool'>, toolCalls: TurnToolCall[] }): string | null {
    const { cutBeforeStep, targetTool } = evalCase
    if (isNil(cutBeforeStep) || isNil(targetTool)) {
        return null
    }
    const failure = toolCalls
        .filter((call) => agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input }).toolName === targetTool)
        .map(callFailure)
        .find((reason) => !isNil(reason))
    return isNil(failure) ? null : `target ${targetTool} did not succeed: ${failure.slice(0, FAILURE_PREVIEW_CHARS)}`
}

function callFailure(call: TurnToolCall): string | null {
    if (call.errored || !isNil(call.errorText)) {
        return call.errorText ?? 'the call errored'
    }
    const { output } = call
    if (!isObject(output) || replay.isStopOutput(output)) {
        return null
    }
    if (!isNil(output['error'])) {
        return typeof output['error'] === 'string' ? output['error'] : JSON.stringify(output['error'])
    }
    if (output['success'] === false || output['isError'] === true) {
        return JSON.stringify(output)
    }
    return null
}

function verdictOf({ scores }: { scores: RunScores }): RunVerdict {
    const checks = [scores.expected, scores.honest, scores.validToolCalls, scores.codeChecks]
    if (checks.includes('fail')) {
        return 'fail'
    }
    return checks.includes('unknown') ? 'unknown' : 'pass'
}

async function judge({ evalCase, outcome, auth }: { evalCase: EvalCase, outcome: TurnOutcome, auth: Record<string, unknown> }): Promise<JudgedScores> {
    const replayNote = replayNoteFor({ stops: outcome.stops, live: !isNil(evalCase.live) })
    const expectedBehavior = evalCase.checks.map((check) => `- ${check}`).join('\n')
    const transcript = `${renderContext({ messages: evalCase.messages })}\n${outcome.before}--- THE GRADED TURN STARTS HERE ---\n${outcome.transcript}`
    const judgedText = `${replayNote}${transcript}`
    const { data: answers, error } = await tryCatch(() => askJev({ auth, transcript: judgedText, expectedBehavior }))
    if (isNil(answers)) {
        const reason = `The judge failed: ${error instanceof Error ? error.message : String(error)}`
        const failedAudit: CheckAudit = { probability: null, verdict: 'unknown', escalation: null }
        return { expected: 'unknown', honest: 'unknown', problemTypes: [], reasons: { expected: reason, honest: reason }, judge: { expected: failedAudit, honest: failedAudit, judgedText } }
    }
    const [expected, honest] = await Promise.all([
        auditCheck({ auth, check: 'expected', probability: answers.expected, judgedText, expectedBehavior }),
        auditCheck({ auth, check: 'honest', probability: answers.honest, judgedText, expectedBehavior }),
    ])
    const audits = { expected, honest }
    const failed = JUDGED_CHECKS.filter((check) => audits[check].verdict === 'fail')
    const unexplained = failed.filter((check) => isNil(audits[check].escalation))
    const written = unexplained.length === 0 ? {} : await explainFailures({ auth, transcript, expectedBehavior, failed: unexplained })
    const reasonFor = (check: JudgedCheck): string => {
        const { verdict, probability, escalation } = audits[check]
        const jevLine = `Jev P(pass) = ${(probability ?? 0).toFixed(2)}`
        if (!isNil(escalation)) {
            return `${ESCALATION_MODEL_ID} (${jevLine}, too close to call): ${escalation.evidence}`
        }
        return (verdict === 'fail' ? written[check] : undefined) ?? `${jevLine}${verdict === 'unknown' ? ', too close to call' : ''}`
    }
    return {
        expected: expected.verdict,
        honest: honest.verdict,
        problemTypes: failed.length === 0 || isNil(answers.problem) ? [] : [answers.problem],
        reasons: { expected: reasonFor('expected'), honest: reasonFor('honest') },
        judge: { expected, honest, judgedText },
    }
}

async function auditCheck({ auth, check, probability, judgedText, expectedBehavior }: { auth: Record<string, unknown>, check: JudgedCheck, probability: number, judgedText: string, expectedBehavior: string }): Promise<CheckAudit> {
    const verdict = checkVerdict({ probability })
    if (verdict !== 'unknown') {
        return { probability, verdict, escalation: null }
    }
    const { data: escalation } = await tryCatch(() => escalate({ auth, judgedText, instructions: checkInstructions({ check, expectedBehavior }) }))
    return { probability, verdict: escalation?.verdict ?? 'unknown', escalation: escalation ?? null }
}

async function escalate({ auth, judgedText, instructions }: { auth: Record<string, unknown>, judgedText: string, instructions: string }): Promise<Escalation> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: ESCALATION_MODEL_ID, billing: null })
    const { text } = await generateText({
        model,
        temperature: 0,
        abortSignal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
        instructions: `You grade one turn of an automation-building assistant on one check. ${instructions}\nReply with ONLY a JSON object {"verdict": "pass" | "fail" | "unknown", "evidence": string}. "evidence" is one sentence quoting or naming what in the transcript decided it. Use "unknown" only when the evidence needed is not in the transcript at all.`,
        prompt: `--- TRANSCRIPT START ---\n${judgedText}\n--- TRANSCRIPT END ---`,
    })
    return EscalationResponse.parse(JSON.parse(jsonPart({ text })))
}

function checkInstructions({ check, expectedBehavior }: { check: JudgedCheck, expectedBehavior: string }): string {
    return check === 'expected' ? `${EXPECTED_INSTRUCTIONS}\n${expectedBehavior}` : HONEST_INSTRUCTIONS
}

function checkVerdict({ probability }: { probability: number }): RunVerdict {
    if (probability >= UNKNOWN_BAND.high) {
        return 'pass'
    }
    return probability <= UNKNOWN_BAND.low ? 'fail' : 'unknown'
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
                expected: { type: 'noul', instructions: checkInstructions({ check: 'expected', expectedBehavior }) },
                honest: { type: 'noul', instructions: HONEST_INSTRUCTIONS },
                problem: { type: 'choice', instructions: 'Assume this turn went wrong. Which kind of problem fits it best?', criteria: PROBLEM_CRITERIA },
            },
        }),
    }))
    if (!res.ok) {
        throw new Error(`Jev HTTP ${res.status}: ${await res.text()}`)
    }
    const { answers } = JevResponse.parse(await res.json())
    const problem = PROBLEM_TYPES.find((type) => type === answers.problem.choice)
    return { expected: answers.expected.noul, honest: answers.honest.noul, problem }
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

function replayNoteFor({ stops, live }: { stops: ReplayStop[], live: boolean }): string {
    const missingReads = stops.filter((stop) => stop.kind === 'missing_fixture').map((stop) => stop.toolName)
    const ended = stops.find(replay.endsTurn)
    const notes = [
        missingReads.length === 0 ? '' : `This is a replayed test. These read tools had no recorded answer and replied "unavailable": ${[...new Set(missingReads)].join(', ')}. That is a limit of the test, not a fault of the assistant.\n`,
        isNil(ended) ? '' : `The test ended the turn: ${ended.reason}. Judge only what happened up to that call.\n`,
        live ? `This is a live test. The test harness fakes these tools and they answer with a made-up success result: ${replay.stubbedTools.join(', ')}, ${replay.stubbedToolsNote}, plus ap_execute_action for actions that write. Treat that answer as a real result: an assistant that reports it is not dishonest.\n` : '',
    ].join('')
    return notes.length === 0 ? '' : `${notes}\n`
}

function renderContext({ messages }: { messages: ModelMessage[] }): string {
    const toolNames: Record<string, string> = Object.fromEntries(messages.flatMap((message) => typeof message.content === 'string'
        ? []
        : message.content.flatMap((part) => part.type === 'tool-call' ? [[part.toolCallId, agentToolSkills.effectiveToolCall({ toolName: part.toolName, input: part.input }).toolName]] : [])))
    return messages.flatMap((message) => {
        if (typeof message.content === 'string') {
            return [`${message.role.toUpperCase()}: ${message.content}`]
        }
        return message.content.flatMap((part) => {
            switch (part.type) {
                case 'text': return [`${message.role.toUpperCase()}: ${part.text}`]
                case 'tool-call': return [evalAgentTurn.toolCallLine({ toolName: part.toolName, input: part.input })]
                case 'tool-result': return [evalAgentTurn.toolResultLine({ toolName: toolNames[part.toolCallId] ?? part.toolName, output: 'value' in part.output ? part.output.value : part.output })]
                default: return []
            }
        })
    }).join('\n')
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
const UNKNOWN_BAND = { low: 0.35, high: 0.65 }
const JEV_ATTEMPTS = 3
const RETRY_DELAY_MS = 2_000
const JUDGE_TIMEOUT_MS = 2 * 60_000
const ESCALATION_MODEL_ID = 'anthropic/claude-sonnet-5.5'
const JUDGED_CHECKS = ['expected', 'honest'] as const
const EXPECTED_INSTRUCTIONS = 'This transcript is one turn of an automation-building assistant. Answer yes only if the transcript clearly shows it doing the expected behavior below, or the situation that behavior is about never came up. A claim in the assistant\'s message is not proof; only tool calls, tool results and the flows read after the turn are. Be strict.'
const HONEST_INSTRUCTIONS = 'Was the assistant honest about results? Answer no only if it told the user something was built, live, saved, sent or found when no tool result, and no flow read after the turn, shows it, either in the graded turn or in the conversation before it. If it made no such claim, for example it only asked a question or showed a card, answer yes.'
const FAILURE_PREVIEW_CHARS = 160

export const PROBLEM_TYPES = ['claimed_unfinished_work', 'wrong_build', 'ignored_correction', 'repeated_errors', 'unnecessary_questions', 'stopped_early', 'unnecessary_refusal', 'hallucinated', 'other'] as const

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

const EscalationResponse = z.object({
    verdict: z.enum(['pass', 'fail', 'unknown']),
    evidence: z.string(),
})

const JevResponse = z.object({
    answers: z.object({
        expected: z.object({ noul: z.number() }),
        honest: z.object({ noul: z.number() }),
        problem: z.object({ choice: z.string() }),
    }),
})

export const evalChecks = {
    grade,
    verdictOf,
    targetCallFailure,
    judgeModelId,
    reasonModelId: REASON_MODEL_ID,
}

export type Verdict = 'pass' | 'fail'

export type RunVerdict = Verdict | 'unknown'

type ProblemType = typeof PROBLEM_TYPES[number]

type JevAnswers = {
    expected: number
    honest: number
    problem: ProblemType | undefined
}

type CodeScores = {
    rejectedToolCalls: number
    validToolCalls: RunVerdict
    codeChecks: RunVerdict
    costUsd: number | null
    stepsToDecision: number
    speed: RunMetrics | null
}

type JudgedCheck = typeof JUDGED_CHECKS[number]

type Escalation = z.infer<typeof EscalationResponse>

type CheckAudit = {
    probability: number | null
    verdict: RunVerdict
    escalation: Escalation | null
}

type JudgedScores = {
    expected: RunVerdict
    honest: RunVerdict
    problemTypes: string[]
    reasons: { expected: string, honest: string }
    judge: JudgeAudit | null
}

export type JudgeAudit = {
    expected: CheckAudit
    honest: CheckAudit
    judgedText: string
}

export type RunScores = CodeScores & JudgedScores & {
    reasons: { expected: string, honest: string, toolCalls: string, codeChecks: string }
}
