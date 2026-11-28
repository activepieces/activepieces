import { aiProviderCredentials, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { generateText } from 'ai'
import { z } from 'zod'
import { Verdict } from './checks'
import { EvalCase } from './eval-case'
import { UploadedRun } from './posthog-experiments'

async function explain({ auth, candidate, runs, verdict }: { auth: Record<string, unknown>, candidate: EvalCase, runs: UploadedRun[], verdict: Verdict }): Promise<CaseExplanation> {
    const pass = runs.filter((run) => run.verdict === 'pass').length
    const fail = runs.filter((run) => run.verdict === 'fail').length
    const unknown = runs.length - pass - fail
    const reliability = `${fail === 0 && verdict === 'pass' ? 'reliable' : 'not reliable'} (${pass} of ${runs.length} runs pass${unknown > 0 ? `, ${unknown} unclear` : ''})`
    const expected = candidate.checks.join(' ')
    if (fail === 0 && unknown === 0) {
        return { reliability, expected, happened: [`All ${runs.length} runs did it.`], means: 'Safe. Nothing to do.' }
    }
    const frequency = howOften({ pass, fail })
    const { data } = await tryCatch(() => summarize({ auth, expected, runs, frequency, allFailed: pass === 0 }))
    return {
        reliability,
        expected,
        happened: data?.happened ?? runs.filter((run) => run.verdict !== 'pass').map((run) => `Run ${run.trial + 1}: ${failures(run)[0] ?? 'unclear'}`),
        means: data?.means ?? (isNil(frequency) ? 'The judge could not decide on some runs. Read those transcripts.' : `A user hits this ${frequency}.`),
    }
}

function howOften({ pass, fail }: { pass: number, fail: number }): string | null {
    if (fail === 0) {
        return null
    }
    const judged = pass + fail
    return fail * 2 >= judged ? `most of the time (${fail} of ${judged} runs)` : `about 1 time in ${Math.round(judged / fail)}`
}

async function summarize({ auth, expected, runs, frequency, allFailed }: { auth: Record<string, unknown>, expected: string, runs: UploadedRun[], frequency: string | null, allFailed: boolean }): Promise<{ happened: string[], means: string }> {
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: SUMMARY_MODEL_ID, billing: null })
    const evidence = runs.map((run) => [`RUN ${run.trial + 1}: ${run.verdict.toUpperCase()}`, ...failures(run).map((reason) => `- ${reason}`)].join('\n')).join('\n\n')
    const { text } = await generateText({
        model,
        temperature: 0,
        abortSignal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS),
        instructions: [
            'You summarize one eval case of a chat agent that builds automations, for a busy engineer. Plain words, short sentences, no jargon, no em dashes.',
            'Use ONLY the listed reasons. Do not guess anything they do not say. "unclear" means the judge could not decide, which is the test\'s weakness, not the agent\'s.',
            '"happened": 1 to 3 lines, each under 15 words. One line per distinct way runs went wrong, naming the runs (e.g. "Runs 1, 2, 5: the question card call was malformed"). Add a line for unclear runs only if there are any.',
            `"means": at most 2 sentences, under 35 words in total: what a real user would experience and what to fix.${isNil(frequency) ? '' : ` Say that a user hits this ${frequency}.`}${allFailed ? ' Every run failed, so say to check the case or the judge first.' : ''}`,
            'Reply with ONLY a JSON object: {"happened": string[], "means": string}.',
        ].join('\n'),
        prompt: `Expected behavior: ${expected}\n\n${evidence}`,
    })
    return Summary.parse(JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)))
}

function failures(run: UploadedRun): string[] {
    const { scores } = run
    return [
        scores.expected === 'pass' ? null : `${scores.expected === 'unknown' ? 'unclear' : 'failed'}: did the expected thing: ${scores.reasons.expected}`,
        scores.honest === 'pass' ? null : `${scores.honest === 'unknown' ? 'unclear' : 'failed'}: honest about results: ${scores.reasons.honest}`,
        scores.validToolCalls === 'fail' ? `failed: valid tool calls: ${scores.reasons.toolCalls}` : null,
        ...run.stops.map((reason) => `replay note: ${reason}`),
    ].flatMap((reason) => isNil(reason) ? [] : [reason])
}

const SUMMARY_MODEL_ID = 'anthropic/claude-haiku-5.5'
const SUMMARY_TIMEOUT_MS = 2 * 60_000

const Summary = z.object({ happened: z.array(z.string()).min(1), means: z.string() })

export const caseSummary = {
    explain,
    failures,
}

export type CaseExplanation = {
    reliability: string
    expected: string
    happened: string[]
    means: string
}
