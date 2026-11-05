import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { ToolSet } from 'ai'
import { evalAgentTurn } from './agent-turn'
import { evalChecks, RunScores, Verdict } from './checks'
import { evalCase, EvalCase, RecordedToolCall } from './eval-case'
import { posthogDataset } from './posthog-dataset'
import { posthogExperiments, VerdictCounts } from './posthog-experiments'
import { evalPrompts } from './prompts'
import { evalToolSet } from './tool-set'

async function main(): Promise<void> {
    if (existsSync(ENV_FILE)) {
        process.loadEnvFile(ENV_FILE)
    }
    const { values } = parseArgs({
        options: {
            'case': { type: 'string', multiple: true },
            'model': { type: 'string', default: DEFAULT_MODEL },
            'dataset': { type: 'string', multiple: true },
            'verbose': { type: 'boolean', default: false },
            'record': { type: 'boolean', default: false },
            'repeats': { type: 'string', default: String(DEFAULT_REPEATS) },
            'steps': { type: 'boolean', default: false },
            'set-cut': { type: 'string', multiple: true },
            'set-target': { type: 'string', multiple: true },
            'upload': { type: 'boolean', default: false },
        },
    })
    const repeats = Math.max(1, Number(values.repeats) || 1)
    const recordMode = values.record
    const onlyCases = new Set((values.case ?? []).map(Number))
    const datasetNames = values.dataset ?? DEFAULT_DATASETS
    const editing = !isNil(values['set-cut']) || !isNil(values['set-target']) || values.steps
    if (editing && datasetNames.length !== 1) {
        throw new Error('--steps, --set-cut and --set-target work on one dataset: pass --dataset <name>')
    }
    if (values.upload && (recordMode || onlyCases.size > 0)) {
        throw new Error('--upload is for the full release run only: drop --case and --record')
    }
    const datasets = await Promise.all(datasetNames.map(async (name) => ({
        name,
        cases: (await posthogDataset.loadItems({ datasetName: name }))
            .map((item) => evalCase.fromDatasetItem(item))
            .filter((candidate) => onlyCases.size === 0 || onlyCases.has(candidate.caseNumber))
            .sort((a, b) => a.caseNumber - b.caseNumber),
    })))
    if (editing) {
        const { cases } = datasets[0]
        if (values.steps) {
            cases.forEach(printSteps)
        }
        await setField({ cases, assignments: values['set-cut'] ?? [], field: 'cutBeforeStep', parse: parseStep })
        await setField({ cases, assignments: values['set-target'] ?? [], field: 'targetTool', parse: (text) => text.length > 0 ? text : undefined })
        return
    }

    const auth = await evalAgentTurn.resolveAuth()
    const mcp = await evalToolSet.connectMcp({ conversationId: EVAL_CONVERSATION_ID })
    const outcomes: DatasetOutcome[] = []
    try {
        for (const dataset of datasets) {
            outcomes.push(await runDataset({ dataset, repeats, recordMode, upload: values.upload, verbose: values.verbose, modelId: values.model, auth, mcpToolSet: mcp.toolSet }))
        }
    }
    finally {
        await mcp.close().catch(() => undefined)
        await evalAgentTurn.cleanupAuth()
    }
    const broken = outcomes.filter((outcome) => outcome.broken)
    console.log(`\n${broken.length === 0 ? '✓ Nothing broke' : `✗ Broken: ${broken.map((outcome) => outcome.reason).join('; ')}`}`)
    process.exit(broken.length === 0 ? 0 : 1)
}

async function runDataset({ dataset, repeats, recordMode, upload, verbose, modelId, auth, mcpToolSet }: { dataset: { name: string, cases: EvalCase[] }, repeats: number, recordMode: boolean, upload: boolean, verbose: boolean, modelId: string, auth: Record<string, unknown>, mcpToolSet: ToolSet }): Promise<DatasetOutcome> {
    const { name, cases } = dataset
    console.log(`\n=== ${name}: ${cases.length} case(s) × ${repeats} run(s) · model ${modelId} · judge ${evalChecks.judgeModelId()} · ${recordMode ? 'RECORD mode: missing reads run live and are saved to PostHog' : 'fixtures only'}${upload ? ' · UPLOADS a release baseline to PostHog' : ' · nothing is uploaded'}`)
    const runs = cases.flatMap((candidate) => Array.from({ length: repeats }, (_, trial) => ({ candidate, trial })))
    const results = await runInBatches({ runs, verbose, run: ({ candidate, trial }) => evaluate({ candidate, trial, mcpToolSet, modelId, auth, recordMode }) })
    const summaries = cases.map((candidate) => summarize({ candidate, results: results.filter((result) => result.candidate.id === candidate.id) }))
    console.log(`\n${name} summary (a case fails when at least half of its runs fail):`)
    summaries.forEach((summary) => console.log(`  ${VERDICT_MARK[summary.verdict]} case ${summary.caseNumber}: ${summary.pass} pass · ${summary.fail} fail · overall ${isNil(summary.overall) ? '-' : summary.overall.toFixed(1)}/10 · ${isNil(summary.costUsd) ? 'cost unknown' : `$${summary.costUsd.toFixed(4)}/run`}`))
    const failing = summaries.filter((summary) => summary.verdict === 'fail').length
    console.log(`\n${summaries.length - failing} pass · ${failing} fail · ${summaries.length} cases`)
    if (recordMode) {
        await saveFixtures({ cases, results })
        return { broken: false, reason: '' }
    }
    if (upload) {
        const experimentId = await posthogExperiments.upload({ runs: results, suiteKey: name, runSource: isNil(process.env['CI']) ? 'local' : 'ci', applicationVersion: gitSha(), modelVersion: modelId, promptVersion: promptVersion() })
        console.log(`\nUploaded release baseline for ${name}: experiment ${experimentId}`)
    }
    const regressed = upload ? 0 : await printDiff({ suiteKey: name, modelVersion: modelId, cases, summaries })
    if (MUST_PASS_DATASETS.has(name) && failing > 0) {
        return { broken: true, reason: `${failing} ${name} case(s) fail` }
    }
    return regressed > 0 ? { broken: true, reason: `${regressed} ${name} case(s) regressed` } : { broken: false, reason: '' }
}

async function runInBatches({ runs, verbose, run }: { runs: PlannedRun[], verbose: boolean, run: (planned: PlannedRun) => Promise<CaseResult> }): Promise<CaseResult[]> {
    const results: CaseResult[] = []
    for (const batch of chunk(runs, CONCURRENCY)) {
        const done = await Promise.all(batch.map(run))
        done.forEach((result) => print({ result, verbose }))
        results.push(...done)
    }
    return results
}

async function evaluate({ candidate, trial, mcpToolSet, modelId, auth, recordMode }: { candidate: EvalCase, trial: number, mcpToolSet: ToolSet, modelId: string, auth: Record<string, unknown>, recordMode: boolean }): Promise<CaseResult> {
    const { data, error } = await tryCatch(async () => {
        const outcome = await evalAgentTurn.run({ evalCase: candidate, mcpToolSet, modelId, auth, recordMode })
        const scores = await evalChecks.grade({ evalCase: candidate, outcome, auth })
        return { scores, stops: outcome.stops.map((stop) => stop.reason), transcript: outcome.transcript, newFixtures: outcome.newFixtures }
    })
    if (error) {
        return { candidate, trial, verdict: 'fail', scores: crashedScores({ reason: error.message }), stops: [], transcript: '', newFixtures: [] }
    }
    return { candidate, trial, verdict: evalChecks.verdictOf({ scores: data.scores }), ...data }
}

function crashedScores({ reason }: { reason: string }): RunScores {
    const message = `The run crashed: ${reason}`
    return { expected: 'fail', honest: 'fail', validToolCalls: 'fail', rejectedToolCalls: 0, overall: null, costUsd: null, stepsToDecision: 0, problemTypes: [], reasons: { expected: message, honest: message, overall: message, toolCalls: message } }
}

function summarize({ candidate, results }: { candidate: EvalCase, results: CaseResult[] }): CaseSummary {
    const pass = results.filter((result) => result.verdict === 'pass').length
    const fail = results.filter((result) => result.verdict === 'fail').length
    const verdict: Verdict = fail * 2 >= pass + fail ? 'fail' : 'pass'
    return { caseNumber: candidate.caseNumber, pass, fail, verdict, overall: average(results.map((result) => result.scores.overall)), costUsd: average(results.map((result) => result.scores.costUsd)) }
}

function average(values: (number | null)[]): number | null {
    const known = values.flatMap((value) => isNil(value) ? [] : [value])
    return known.length === 0 ? null : known.reduce((total, value) => total + value, 0) / known.length
}

async function printDiff({ suiteKey, modelVersion, cases, summaries }: { suiteKey: string, modelVersion: string, cases: EvalCase[], summaries: CaseSummary[] }): Promise<number> {
    const { data: found, error } = await tryCatch(() => posthogExperiments.baseline({ suiteKey, modelVersion }))
    if (error) {
        console.log(`\nCould not read the release baseline from PostHog: ${error.message}`)
        return 0
    }
    if (isNil(found)) {
        console.log(`\nNo release baseline in PostHog yet for ${suiteKey} on ${modelVersion}, so there is nothing to diff against.`)
        return 0
    }
    console.log(`\nDiff against the release baseline (commit ${found.applicationVersion.slice(0, SHORT_SHA)}, same model). A change counts only when at least ${Math.round(CLEAR_SHARE * 100)}% of at least ${MIN_JUDGED_RUNS} runs agree on both sides:`)
    const labels = cases.map((candidate) => {
        const before = found.counts.get(posthogExperiments.caseKey(candidate)) ?? { pass: 0, fail: 0 }
        const now = summaries.find((summary) => summary.caseNumber === candidate.caseNumber) ?? { pass: 0, fail: 0 }
        const label = diffLabel({ before: clearVerdict(before), now: clearVerdict(now) })
        console.log(`  case ${candidate.caseNumber}: ${describe(before)} → ${describe(now)}  ${label}`)
        return label
    })
    return labels.filter((label) => label === 'REGRESSED').length
}

function clearVerdict({ pass, fail }: VerdictCounts): Verdict | 'unclear' {
    const judged = pass + fail
    if (judged < MIN_JUDGED_RUNS) {
        return 'unclear'
    }
    if (pass >= judged * CLEAR_SHARE) {
        return 'pass'
    }
    return fail >= judged * CLEAR_SHARE ? 'fail' : 'unclear'
}

function describe({ pass, fail }: VerdictCounts): string {
    return `${pass} pass/${fail} fail`
}

function diffLabel({ before, now }: { before: Verdict | 'unclear', now: Verdict | 'unclear' }): string {
    if (before === 'unclear' || now === 'unclear') {
        return 'unclear'
    }
    if (before === now) {
        return 'same'
    }
    return now === 'fail' ? 'REGRESSED' : 'FIXED'
}

function gitSha(): string {
    return process.env['GITHUB_SHA'] ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim()
}

function promptVersion(): string {
    const guides = evalPrompts.loadGuides()
    const text = [evalPrompts.loadSystemPrompt(), ...Object.keys(guides).sort().map((topic) => guides[topic])].join('\n')
    return createHash('sha256').update(text).digest('hex').slice(0, PROMPT_HASH_CHARS)
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
    const { scores } = result
    const line = (label: string, verdict: Verdict, reason: string): void => {
        console.log(`    ${VERDICT_LABEL[verdict]}  ${label}${verdict === 'fail' ? `: ${reason}` : ''}`)
    }
    line('did the expected thing', scores.expected, scores.reasons.expected)
    line('honest about results', scores.honest, scores.reasons.honest)
    line(`valid tool calls (${scores.rejectedToolCalls} rejected)`, scores.validToolCalls, scores.reasons.toolCalls)
    console.log(`    overall ${scores.overall ?? '-'}/10 · ${scores.stepsToDecision} step(s) · ${isNil(scores.costUsd) ? 'cost unknown' : `$${scores.costUsd.toFixed(4)}`}${scores.problemTypes.length > 0 ? ` · problems: ${scores.problemTypes.join(', ')}` : ''}`)
    result.stops.forEach((reason) => console.log(`    replay stopped: ${reason}`))
}

const ENV_FILE = '.env.dev'
const DEFAULT_MODEL = 'z-ai/glm-5.3'
const DEFAULT_DATASETS = ['chat-prod-failures', 'chat-core']
const MUST_PASS_DATASETS = new Set(['chat-core'])
const EVAL_CONVERSATION_ID = 'eval-conversation'
const CONCURRENCY = 4
const SHORT_SHA = 8
const DEFAULT_REPEATS = 5
const MIN_JUDGED_RUNS = 3
const CLEAR_SHARE = 0.8
const PROMPT_HASH_CHARS = 12
const VERDICT_MARK: Record<Verdict, string> = { pass: '✓', fail: '✗' }
const VERDICT_LABEL: Record<Verdict, string> = { pass: 'pass', fail: 'FAIL' }

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
})

type CaseSummary = {
    caseNumber: number
    pass: number
    fail: number
    verdict: Verdict
    overall: number | null
    costUsd: number | null
}

type DatasetOutcome = {
    broken: boolean
    reason: string
}

type PlannedRun = {
    candidate: EvalCase
    trial: number
}

type CaseResult = {
    candidate: EvalCase
    trial: number
    verdict: Verdict
    scores: RunScores
    stops: string[]
    transcript: string
    newFixtures: RecordedToolCall[]
}
