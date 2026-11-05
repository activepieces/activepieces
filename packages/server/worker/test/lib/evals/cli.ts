import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { ToolSet } from 'ai'
import { evalAgentTurn } from './agent-turn'
import { CheckResult, evalChecks, Verdict } from './checks'
import { evalCase, EvalCase, RecordedToolCall } from './eval-case'
import { posthogDataset } from './posthog-dataset'
import { evalToolSet } from './tool-set'

async function main(): Promise<void> {
    if (existsSync(ENV_FILE)) {
        process.loadEnvFile(ENV_FILE)
    }
    const { values } = parseArgs({
        options: {
            'case': { type: 'string', multiple: true },
            'model': { type: 'string', default: DEFAULT_MODEL },
            'dataset': { type: 'string', default: DEFAULT_DATASET },
            'verbose': { type: 'boolean', default: false },
            'record': { type: 'boolean', default: false },
            'repeats': { type: 'string', default: '1' },
            'steps': { type: 'boolean', default: false },
            'set-cut': { type: 'string', multiple: true },
            'set-target': { type: 'string', multiple: true },
        },
    })
    const repeats = Math.max(1, Number(values.repeats) || 1)
    const recordMode = values.record
    const onlyCases = new Set((values.case ?? []).map(Number))
    const items = await posthogDataset.loadItems({ datasetName: values.dataset })
    const cases = items
        .map((item) => evalCase.fromDatasetItem(item))
        .filter((candidate) => onlyCases.size === 0 || onlyCases.has(candidate.caseNumber))
        .sort((a, b) => a.caseNumber - b.caseNumber)
    if (!isNil(values['set-cut']) || !isNil(values['set-target'])) {
        await setField({ cases, assignments: values['set-cut'] ?? [], field: 'cutBeforeStep', parse: parseStep })
        await setField({ cases, assignments: values['set-target'] ?? [], field: 'targetTool', parse: (text) => text.length > 0 ? text : undefined })
        return
    }
    if (values.steps) {
        cases.forEach(printSteps)
        return
    }
    console.log(`${cases.length} case(s) × ${repeats} run(s) from "${values.dataset}" · model ${values.model} · judge ${evalChecks.judgeModelId()} · ${recordMode ? 'RECORD mode: missing reads run live and are saved to PostHog' : 'fixtures only'}${recordMode ? '' : ' · nothing is uploaded'}`)

    const auth = await evalAgentTurn.resolveAuth()
    const mcp = await evalToolSet.connectMcp({ conversationId: EVAL_CONVERSATION_ID })
    const runs = cases.flatMap((candidate) => Array.from({ length: repeats }, () => candidate))
    const results = await runInBatches({ runs, verbose: values.verbose, run: (candidate) => evaluate({ candidate, mcpToolSet: mcp.toolSet, modelId: values.model, auth, recordMode }) })
        .finally(async () => {
            await mcp.close().catch(() => undefined)
            await evalAgentTurn.cleanupAuth()
        })

    const summaries = cases.map((candidate) => summarize({ candidate, results: results.filter((result) => result.candidate.id === candidate.id) }))
    console.log(`\nSummary (a case fails when at least half of its judged runs fail):`)
    summaries.forEach((summary) => console.log(`  ${VERDICT_MARK[summary.verdict]} case ${summary.caseNumber}: ${summary.pass} pass · ${summary.fail} fail · ${summary.noVerdict} no verdict`))
    const count = (verdict: Verdict): number => summaries.filter((summary) => summary.verdict === verdict).length
    console.log(`\n${count('pass')} pass · ${count('fail')} fail · ${count('no_verdict')} no verdict · ${summaries.length} cases`)
    if (recordMode) {
        await saveFixtures({ cases, results })
    }
    process.exit(count('fail') === 0 ? 0 : 1)
}

async function runInBatches({ runs, verbose, run }: { runs: EvalCase[], verbose: boolean, run: (candidate: EvalCase) => Promise<CaseResult> }): Promise<CaseResult[]> {
    const results: CaseResult[] = []
    for (const batch of chunk(runs, CONCURRENCY)) {
        const done = await Promise.all(batch.map(run))
        done.forEach((result) => print({ result, verbose }))
        results.push(...done)
    }
    return results
}

async function evaluate({ candidate, mcpToolSet, modelId, auth, recordMode }: { candidate: EvalCase, mcpToolSet: ToolSet, modelId: string, auth: Record<string, unknown>, recordMode: boolean }): Promise<CaseResult> {
    const { data, error } = await tryCatch(async () => {
        const outcome = await evalAgentTurn.run({ evalCase: candidate, mcpToolSet, modelId, auth, recordMode })
        const checks = await evalChecks.grade({ evalCase: candidate, outcome, auth })
        return { checks, stops: outcome.stops.map((stop) => stop.reason), transcript: outcome.transcript, newFixtures: outcome.newFixtures }
    })
    if (error) {
        return { candidate, verdict: 'fail', checks: [{ name: 'run completed', verdict: 'fail', reason: error.message }], stops: [], transcript: '', newFixtures: [] }
    }
    return { candidate, verdict: evalChecks.caseVerdict({ checks: data.checks }), ...data }
}

function summarize({ candidate, results }: { candidate: EvalCase, results: CaseResult[] }): CaseSummary {
    const pass = results.filter((result) => result.verdict === 'pass').length
    const fail = results.filter((result) => result.verdict === 'fail').length
    const noVerdict = results.length - pass - fail
    const verdict: Verdict = pass + fail === 0 ? 'no_verdict' : (fail * 2 >= pass + fail ? 'fail' : 'pass')
    return { caseNumber: candidate.caseNumber, pass, fail, noVerdict, verdict }
}

async function saveFixtures({ cases, results }: { cases: EvalCase[], results: CaseResult[] }): Promise<void> {
    for (const candidate of cases) {
        const fixtures = results.filter((result) => result.candidate.id === candidate.id).flatMap((result) => result.newFixtures)
        if (fixtures.length === 0) {
            continue
        }
        const { added, total } = await posthogDataset.addFixtures({ itemId: candidate.id, fixtures })
        console.log(`case ${candidate.caseNumber}: saved ${added} new fixture(s) to PostHog (${total} in total)`)
    }
}

async function setField({ cases, assignments, field, parse }: { cases: EvalCase[], assignments: string[], field: string, parse: (text: string) => string | number | undefined }): Promise<void> {
    for (const assignment of assignments) {
        const [caseText, valueText = ''] = assignment.split('=')
        const target = cases.find((candidate) => candidate.caseNumber === Number(caseText))
        const value = parse(valueText)
        if (isNil(target) || isNil(value)) {
            console.log(`skipped "${assignment}": use <case>=<value>`)
            continue
        }
        await posthogDataset.setMetadataField({ itemId: target.id, field, value })
        console.log(`case ${target.caseNumber}: ${field} = ${value}`)
    }
}

function parseStep(text: string): number | undefined {
    const step = Number(text)
    return Number.isInteger(step) && step >= 0 ? step : undefined
}

function printSteps(candidate: EvalCase): void {
    console.log(`\ncase ${candidate.caseNumber} [${candidate.problemType}] · cutBeforeStep ${candidate.cutBeforeStep ?? 'not set'} · targetTool ${candidate.targetTool ?? 'not set'}`)
    candidate.steps.forEach((step) => {
        const calls = step.toolCalls.map((call) => `${call.toolName}${call.rejected ? ' (REJECTED)' : ''}`).join(', ')
        console.log(`    step ${step.index}: ${calls || '(text only)'}${step.text.length > 0 ? ` · "${step.text}"` : ''}`)
    })
}

function print({ result, verbose }: { result: CaseResult, verbose: boolean }): void {
    console.log(`\n${VERDICT_MARK[result.verdict]} case ${result.candidate.caseNumber} [${result.candidate.problemType}]`)
    if (verbose) {
        console.log(`    starts at step ${result.candidate.cutBeforeStep ?? 0} · ${result.candidate.messages.length} message(s) before it · fixtures: ${result.candidate.recordedToolCalls.map((call) => call.toolName).join(', ') || 'none'}`)
        console.log(`    USER: ${result.candidate.userMessage}`)
        console.log(result.transcript.split('\n').map((line) => `    ${line}`).join('\n'))
    }
    result.checks.forEach((check) => {
        console.log(`    ${VERDICT_LABEL[check.verdict]}  ${check.name}`)
        if (check.verdict !== 'pass') {
            console.log(`          ${check.reason}`)
        }
    })
    result.stops.forEach((reason) => console.log(`    replay stopped: ${reason}`))
}

const ENV_FILE = '.env.dev'
const DEFAULT_MODEL = 'z-ai/glm-5.3'
const DEFAULT_DATASET = 'chat-regressions'
const EVAL_CONVERSATION_ID = 'eval-conversation'
const CONCURRENCY = 4
const VERDICT_MARK: Record<Verdict, string> = { pass: '✓', fail: '✗', no_verdict: '?' }
const VERDICT_LABEL: Record<Verdict, string> = { pass: 'pass', fail: 'FAIL', no_verdict: 'no verdict' }

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
})

type CaseSummary = {
    caseNumber: number
    pass: number
    fail: number
    noVerdict: number
    verdict: Verdict
}

type CaseResult = {
    candidate: EvalCase
    verdict: Verdict
    checks: CheckResult[]
    stops: string[]
    transcript: string
    newFixtures: RecordedToolCall[]
}
