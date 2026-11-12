import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { ToolSet } from 'ai'
import { evalAgentTurn } from './agent-turn'
import { caseSummary, CaseExplanation } from './case-summary'
import { evalChecks, RunScores, RunVerdict, Verdict } from './checks'
import { colors } from './colors'
import { evalCase, EvalCase, RecordedToolCall } from './eval-case'
import { posthogDataset } from './posthog-dataset'
import { Baseline, posthogExperiments, UploadedRun, VerdictCounts } from './posthog-experiments'
import { progressTable } from './progress-table'
import { evalPrompts } from './prompts'
import { replay, StaleRecording } from './replay'
import { resultsBrowser } from './results-browser'
import { toolChanges, ToolFingerprints } from './tool-changes'
import { evalToolSet, McpTools } from './tool-set'

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
        throw new Error('--upload is for the full main run only: drop --case and --record')
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

    const [auth, mcp, baselineReads] = await Promise.all([
        evalAgentTurn.resolveAuth(),
        evalToolSet.connectMcp(),
        Promise.all(datasets.map((dataset) => readBaseline({ suiteKey: dataset.name, modelVersion: values.model, skip: values.upload || recordMode }))),
    ])
    console.log(`Dev server MCP tools run in project "${mcp.projectName}"`)
    const schemaTools = evalToolSet.build({ mcp, caseReplay: replay.create({ recordedToolCalls: [] }), auth, recordMode: false })
    const toolFingerprints = await toolChanges.fingerprints({ tools: schemaTools })
    const live = Boolean(process.stdout.isTTY) && !values.verbose
    const browse = live && Boolean(process.stdin.isTTY)
    const ran: RanDataset[] = []
    let explained = new Map<string, CaseExplanation>()
    try {
        for (const [index, dataset] of datasets.entries()) {
            ran.push(await runDataset({ dataset, repeats, recordMode, upload: values.upload, verbose: values.verbose, live, modelId: values.model, auth, mcp, schemaTools, baselineRead: baselineReads[index], toolFingerprints }))
        }
        if (!recordMode) {
            console.log(colors.dim('\nWriting a short summary for each case…'))
            explained = await explainAll({ ran, auth })
        }
    }
    finally {
        await mcp.close().catch(() => undefined)
        await evalAgentTurn.cleanupAuth()
    }
    if (browse) {
        await resultsBrowser.open({ datasets: ran.map(({ name, cases, results }) => ({ name, cases, runs: results, verdictOf: (candidate) => summarize({ datasetName: name, candidate, results: results.filter((result) => result.candidate.id === candidate.id) }).verdict, explanationOf: (candidate) => explained.get(candidate.id) })) })
    }
    const outcomes: DatasetOutcome[] = []
    for (const dataset of ran) {
        outcomes.push(await reportDataset({ ...dataset, explained, live, browse, recordMode, upload: values.upload, modelId: values.model, toolFingerprints }))
    }
    const broken = outcomes.filter((outcome) => outcome.status === 'broken')
    const unchecked = outcomes.filter((outcome) => outcome.status === 'unchecked')
    console.log(`\n${finalLine({ broken, unchecked })}`)
    process.exit(broken.length === 0 ? 0 : 1)
}

function finalLine({ broken, unchecked }: { broken: DatasetOutcome[], unchecked: DatasetOutcome[] }): string {
    if (broken.length > 0) {
        return colors.bold(colors.red(`✗ Broken: ${broken.map((outcome) => outcome.reason).join('; ')}`))
    }
    if (unchecked.length > 0) {
        return colors.bold(colors.yellow(`⚠ Nothing to compare: ${unchecked.map((outcome) => outcome.reason).join('; ')}. Regressions were not checked.`))
    }
    return colors.bold(colors.green('✓ Nothing broke'))
}

async function readBaseline({ suiteKey, modelVersion, skip }: { suiteKey: string, modelVersion: string, skip: boolean }): Promise<BaselineRead> {
    if (skip) {
        return { kind: 'skipped' }
    }
    const { data, error } = await tryCatch(() => posthogExperiments.baseline({ suiteKey, modelVersion }))
    if (error) {
        return { kind: 'error', message: error.message }
    }
    return isNil(data) ? { kind: 'missing' } : { kind: 'found', baseline: data }
}

function changedSinceBaseline({ baselineRead, toolFingerprints }: { baselineRead: BaselineRead, toolFingerprints: ToolFingerprints }): string[] | null {
    if (baselineRead.kind !== 'found' || isNil(baselineRead.baseline.toolFingerprints)) {
        return null
    }
    return toolChanges.changed({ before: baselineRead.baseline.toolFingerprints, now: toolFingerprints })
}

function printToolChanges({ baselineRead, changedTools }: { baselineRead: BaselineRead, changedTools: string[] | null }): void {
    if (baselineRead.kind !== 'found') {
        return
    }
    if (isNil(changedTools)) {
        console.log(colors.dim('Tool changes not checked: the main baseline has no tool definitions (uploaded before this check, or its payload expired after 30 days).'))
        return
    }
    if (changedTools.length === 0) {
        console.log(colors.dim('No tool description or input schema changed vs main.'))
        return
    }
    console.log(colors.yellow(`Tools whose description or input schema changed vs main: ${changedTools.join(', ')}. Cases that use them run first.`))
}

function printUntested({ cases, changedTools }: { cases: EvalCase[], changedTools: string[] | null }): void {
    const lines = cases.flatMap((candidate) => {
        const tools = toolChanges.untested({ evalCase: candidate, changedTools: changedTools ?? [] })
        return tools.length === 0 ? [] : [`  case ${candidate.caseNumber} · ${candidate.title}: ${tools.join(', ')}`]
    })
    if (lines.length === 0) {
        return
    }
    console.log(colors.yellow(`\nThese cases answer a tool you changed from recordings, so their result does not test your change. Use the agent bench for that:\n${lines.join('\n')}`))
}

async function runDataset({ dataset, repeats, recordMode, upload, verbose, live, modelId, auth, mcp, schemaTools, baselineRead, toolFingerprints }: { dataset: { name: string, cases: EvalCase[] }, repeats: number, recordMode: boolean, upload: boolean, verbose: boolean, live: boolean, modelId: string, auth: Record<string, unknown>, mcp: McpTools, schemaTools: ToolSet, baselineRead: BaselineRead, toolFingerprints: ToolFingerprints }): Promise<RanDataset> {
    const { name, cases } = dataset
    const changedTools = changedSinceBaseline({ baselineRead, toolFingerprints })
    const splits = new Map(await Promise.all(cases.map(async (candidate) => [candidate.id, await replay.splitStale({ tools: schemaTools, recordedToolCalls: candidate.recordedToolCalls })] as const)))
    console.log(`\n${colors.bold(colors.cyan(`=== ${name}`))}: ${cases.length} case(s) × ${repeats} run(s) · model ${modelId} · judge ${evalChecks.judgeModelId()} (reasons ${evalChecks.reasonModelId}) · web and catalog reads run live · ${recordMode ? 'RECORD mode: missing workspace reads run live on the dev server and are saved to PostHog; writes never run' : 'workspace reads and writes replay recordings'}${upload ? ' · UPLOADS a main baseline to PostHog' : ' · nothing is uploaded'}`)
    printToolChanges({ baselineRead, changedTools })
    printStale({ cases, stale: (candidate) => splits.get(candidate.id)?.stale ?? [] })
    const touched = (candidate: EvalCase): boolean => toolChanges.touches({ evalCase: candidate, changedTools: changedTools ?? [] })
    const ordered = [...cases.filter(touched), ...cases.filter((candidate) => !touched(candidate))]
    const runs = ordered.flatMap((candidate) => Array.from({ length: repeats }, (_, trial) => ({ candidate, trial })))
    const table = live ? progressTable.create({ cases, repeats, verdictOf: (counts) => caseVerdict({ datasetName: name, ...counts }) }) : null
    const results = await runPool({
        runs,
        run: (planned) => {
            table?.start(planned)
            return evaluate({ ...planned, recordedToolCalls: splits.get(planned.candidate.id)?.fresh ?? [], mcp, modelId, auth, recordMode })
        },
        onResult: (result) => isNil(table) ? print({ result, verbose }) : table.finish({ ...result, runCostUsd: result.scores.costUsd }),
    })
    table?.stop()
    return { name, cases, results, baselineRead, changedTools }
}

async function explainAll({ ran, auth }: { ran: RanDataset[], auth: Record<string, unknown> }): Promise<Map<string, CaseExplanation>> {
    const entries = await Promise.all(ran.flatMap(({ name, cases, results }) => cases.map(async (candidate) => {
        const runs = results.filter((result) => result.candidate.id === candidate.id).sort((a, b) => a.trial - b.trial)
        const { verdict } = summarize({ datasetName: name, candidate, results: runs })
        return [candidate.id, await caseSummary.explain({ auth, candidate, runs, verdict })] as const
    })))
    return new Map(entries)
}

function printExplanation({ summary, title, explanation }: { summary: CaseSummary, title: string, explanation: CaseExplanation | undefined }): void {
    const head = `  ${VERDICT_MARK[summary.verdict]} ${colors.bold(`case ${summary.caseNumber} · ${title}`)} · ${summary.verdict === 'pass' ? colors.green(explanation?.reliability ?? 'pass') : colors.red(explanation?.reliability ?? 'fail')}`
    if (isNil(explanation)) {
        console.log(`${head} · ${summary.pass} pass · ${summary.fail} fail`)
        return
    }
    if (summary.fail === 0 && summary.verdict === 'pass' && explanation.happened.length === 1) {
        console.log(`${head} · ${colors.dim(explanation.means)}`)
        return
    }
    console.log(head)
    console.log(`      ${colors.dim('expected')}  ${explanation.expected}`)
    explanation.happened.forEach((line, index) => console.log(`      ${colors.dim(index === 0 ? 'happened' : '        ')}  ${line}`))
    console.log(`      ${colors.dim('means   ')}  ${colors.bold(explanation.means)}`)
}

async function reportDataset({ name, cases, results, explained, live, browse, recordMode, upload, modelId, toolFingerprints, baselineRead, changedTools }: RanDataset & { explained: Map<string, CaseExplanation>, live: boolean, browse: boolean, recordMode: boolean, upload: boolean, modelId: string, toolFingerprints: ToolFingerprints }): Promise<DatasetOutcome> {
    if (live && !browse) {
        results.filter((result) => result.verdict === 'fail').sort((a, b) => a.candidate.caseNumber - b.candidate.caseNumber || a.trial - b.trial).forEach((result) => print({ result, verbose: false }))
    }
    const summaries = cases.map((candidate) => summarize({ datasetName: name, candidate, results: results.filter((result) => result.candidate.id === candidate.id) }))
    console.log(`\n${colors.bold(`${name} summary`)} ${colors.dim(`(a case passes when ${passRule(name)})`)}`)
    if (!browse) {
        cases.forEach((candidate, index) => printExplanation({ summary: summaries[index], title: candidate.title, explanation: explained.get(candidate.id) }))
    }
    const failing = summaries.filter((summary) => summary.verdict === 'fail').length
    const clearlyFailing = summaries.filter((summary) => clearVerdict(summary) === 'fail').length
    console.log(`${colors.green(`${summaries.length - failing} pass`)} · ${failing > 0 ? colors.red(`${failing} fail`) : `${failing} fail`} ${colors.dim(`(${clearlyFailing} clearly)`)} · ${summaries.length} cases`)
    if (recordMode) {
        await saveFixtures({ cases, results })
        return { status: 'ok', reason: '' }
    }
    if (upload) {
        const experimentId = await posthogExperiments.upload({ runs: results, suiteKey: name, runSource: isNil(process.env['CI']) ? 'local' : 'ci', applicationVersion: gitSha(), modelVersion: modelId, promptVersion: promptVersion(), toolFingerprints })
        console.log(`\nUploaded main baseline for ${name}: experiment ${experimentId}`)
    }
    const regressed = printDiff({ baselineRead, suiteKey: name, modelVersion: modelId, cases, summaries })
    printUntested({ cases, changedTools })
    if (MUST_PASS_DATASETS.has(name) && clearlyFailing > 0) {
        return { status: 'broken', reason: `${clearlyFailing} ${name} case(s) clearly fail` }
    }
    switch (baselineRead.kind) {
        case 'error': return { status: 'broken', reason: `could not read the main baseline for ${name}: ${baselineRead.message}` }
        case 'missing': return { status: 'unchecked', reason: `no main baseline for ${name} on ${modelId}` }
        case 'skipped': return { status: 'ok', reason: '' }
        case 'found': return regressed > 0 ? { status: 'broken', reason: `${regressed} ${name} case(s) regressed` } : { status: 'ok', reason: '' }
    }
}

function printStale({ cases, stale }: { cases: EvalCase[], stale: (candidate: EvalCase) => StaleRecording[] }): void {
    const lines = cases.flatMap((candidate) => stale(candidate).map((recording) => `  case ${candidate.caseNumber} · ${recording.toolName}: ${recording.reason}`))
    if (lines.length === 0) {
        return
    }
    console.log(colors.yellow(`\nStale recordings, left out of the replay (re-record these cases):\n${lines.join('\n')}`))
}

async function runPool({ runs, run, onResult }: { runs: PlannedRun[], run: (planned: PlannedRun) => Promise<CaseResult>, onResult: (result: CaseResult) => void }): Promise<CaseResult[]> {
    const queue = [...runs]
    const results: CaseResult[] = []
    const worker = async (): Promise<void> => {
        for (let next = queue.shift(); !isNil(next); next = queue.shift()) {
            const result = await run(next)
            onResult(result)
            results.push(result)
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    return results
}

async function evaluate({ candidate, trial, recordedToolCalls, mcp, modelId, auth, recordMode }: { candidate: EvalCase, trial: number, recordedToolCalls: RecordedToolCall[], mcp: McpTools, modelId: string, auth: Record<string, unknown>, recordMode: boolean }): Promise<CaseResult> {
    const { data, error } = await tryCatch(async () => {
        const outcome = await evalAgentTurn.run({ evalCase: candidate, recordedToolCalls, mcp, modelId, auth, recordMode })
        const scores = await evalChecks.grade({ evalCase: candidate, outcome, auth })
        return { scores, stops: outcome.stops.map((stop) => stop.reason), transcript: outcome.transcript, newFixtures: outcome.newFixtures }
    })
    if (error) {
        return { candidate, trial, verdict: 'unknown', scores: crashedScores({ reason: error.message }), stops: [], transcript: '', newFixtures: [] }
    }
    return { candidate, trial, verdict: evalChecks.verdictOf({ scores: data.scores }), ...data }
}

function crashedScores({ reason }: { reason: string }): RunScores {
    const message = `The run crashed: ${reason}`
    return { expected: 'unknown', honest: 'unknown', validToolCalls: 'unknown', rejectedToolCalls: 0, costUsd: null, stepsToDecision: 0, problemTypes: [], reasons: { expected: message, honest: message, toolCalls: message } }
}

function summarize({ datasetName, candidate, results }: { datasetName: string, candidate: EvalCase, results: CaseResult[] }): CaseSummary {
    const pass = results.filter((result) => result.verdict === 'pass').length
    const fail = results.filter((result) => result.verdict === 'fail').length
    const verdict = caseVerdict({ datasetName, pass, fail: results.length - pass })
    return { caseNumber: candidate.caseNumber, pass, fail, verdict, costUsd: average(results.map((result) => result.scores.costUsd)) }
}

function caseVerdict({ datasetName, pass, fail }: { datasetName: string } & VerdictCounts): Verdict {
    const judged = pass + fail
    return pass * 2 > judged && pass >= judged * (MIN_PASS_SHARE[datasetName] ?? 0) ? 'pass' : 'fail'
}

function passRule(datasetName: string): string {
    const share = MIN_PASS_SHARE[datasetName]
    if (isNil(share)) {
        return 'more than half of its runs pass'
    }
    return share === 1 ? 'every run passes (pass^k)' : `at least ${Math.round(share * 100)}% of its runs pass`
}

function average(values: (number | null)[]): number | null {
    const known = values.flatMap((value) => isNil(value) ? [] : [value])
    return known.length === 0 ? null : known.reduce((total, value) => total + value, 0) / known.length
}

function printDiff({ baselineRead, suiteKey, modelVersion, cases, summaries }: { baselineRead: BaselineRead, suiteKey: string, modelVersion: string, cases: EvalCase[], summaries: CaseSummary[] }): number {
    if (baselineRead.kind === 'skipped') {
        return 0
    }
    if (baselineRead.kind === 'error') {
        console.log(colors.red(`\nCould not read the main baseline from PostHog: ${baselineRead.message}`))
        return 0
    }
    if (baselineRead.kind === 'missing') {
        console.log(colors.yellow(`\nNo main baseline in PostHog yet for ${suiteKey} on ${modelVersion}, so there is nothing to compare against.`))
        return 0
    }
    const found = baselineRead.baseline
    console.log(`\n${colors.bold(`Diff vs main baseline ${found.applicationVersion.slice(0, SHORT_SHA)}`)} ${colors.dim(`same model · a change counts only when at least ${Math.round(CLEAR_SHARE * 100)}% of at least ${MIN_JUDGED_RUNS} runs agree on both sides`)}`)
    console.log(colors.dim(`  ${padEnd('case', 4)}  ${padEnd('title', DIFF_TITLE_WIDTH)}  ${padEnd('baseline', 8)}  ${padEnd('now', 8)}  change`))
    const labels = cases.map((candidate) => {
        const before = found.counts.get(posthogExperiments.caseKey(candidate)) ?? { pass: 0, fail: 0 }
        const now = summaries.find((summary) => summary.caseNumber === candidate.caseNumber) ?? { pass: 0, fail: 0 }
        const label = diffLabel({ before: clearVerdict(before), now: clearVerdict(now) })
        console.log(`  ${padEnd(String(candidate.caseNumber), 4)}  ${padEnd(candidate.title, DIFF_TITLE_WIDTH)}  ${describe(before)}  ${describe(now)}  ${DIFF_LABEL[label]}`)
        return label
    })
    const count = (label: DiffLabel): number => labels.filter((candidate) => candidate === label).length
    console.log(`  ${colors.green(`${count('FIXED')} fixed`)} · ${count('REGRESSED') > 0 ? colors.red(`${count('REGRESSED')} regressed`) : '0 regressed'} · ${colors.yellow(`${count('unclear')} unclear`)} · ${colors.dim(`${count('same')} same`)}`)
    return count('REGRESSED')
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

function describe(counts: VerdictCounts): string {
    const text = padEnd(`${counts.pass}/${counts.pass + counts.fail}`, 8)
    const verdict = clearVerdict(counts)
    if (verdict === 'unclear') {
        return colors.yellow(text)
    }
    return verdict === 'pass' ? colors.green(text) : colors.red(text)
}

function padEnd(text: string, width: number): string {
    return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width)
}

function diffLabel({ before, now }: { before: Verdict | 'unclear', now: Verdict | 'unclear' }): DiffLabel {
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
    const guides = evalPrompts.guides()
    const text = [evalPrompts.systemPrompt(), ...Object.keys(guides).sort().map((topic) => guides[topic])].join('\n')
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
    console.log(`\n${VERDICT_MARK[result.verdict]} case ${result.candidate.caseNumber} run ${result.trial + 1} [${result.candidate.problemType}]`)
    if (verbose) {
        console.log(`    starts at step ${result.candidate.cutBeforeStep ?? 0} · ${result.candidate.messages.length} message(s) before it · fixtures: ${result.candidate.recordedToolCalls.map((call) => call.toolName).join(', ') || 'none'}`)
        console.log(`    USER: ${result.candidate.userMessage}`)
        console.log(result.transcript.split('\n').map((line) => `    ${line}`).join('\n'))
    }
    const { scores } = result
    const line = (label: string, verdict: RunVerdict, reason: string): void => {
        console.log(`    ${VERDICT_LABEL[verdict]}  ${label}${verdict === 'pass' ? '' : `: ${reason}`}`)
    }
    line('did the expected thing', scores.expected, scores.reasons.expected)
    line('honest about results', scores.honest, scores.reasons.honest)
    line(`valid tool calls (${scores.rejectedToolCalls} rejected)`, scores.validToolCalls, scores.reasons.toolCalls)
    console.log(`    ${scores.stepsToDecision} step(s) · ${isNil(scores.costUsd) ? 'cost unknown' : `$${scores.costUsd.toFixed(4)}`}${scores.problemTypes.length > 0 ? ` · problems: ${scores.problemTypes.join(', ')}` : ''}`)
    result.stops.forEach((reason) => console.log(`    replay note: ${reason}`))
}

const ENV_FILE = '.env.dev'
const DEFAULT_MODEL = 'z-ai/glm-5.3'
const DEFAULT_DATASETS = ['chat-prod-failures', 'chat-core']
const MUST_PASS_DATASETS = new Set(['chat-core'])
const MIN_PASS_SHARE: Partial<Record<string, number>> = { 'chat-core': 1 }
const CONCURRENCY = 4
const SHORT_SHA = 8
const DEFAULT_REPEATS = 5
const MIN_JUDGED_RUNS = 3
const CLEAR_SHARE = 0.8
const PROMPT_HASH_CHARS = 12
const VERDICT_MARK: Record<RunVerdict, string> = { pass: colors.green('✓'), fail: colors.red('✗'), unknown: colors.yellow('?') }
const VERDICT_LABEL: Record<RunVerdict, string> = { pass: colors.green('pass'), fail: colors.red('FAIL'), unknown: colors.yellow('unclear') }
const DIFF_TITLE_WIDTH = 34
const DIFF_LABEL: Record<DiffLabel, string> = { same: colors.dim('= same'), unclear: colors.yellow('? unclear'), FIXED: colors.bold(colors.green('▲ fixed')), REGRESSED: colors.bold(colors.red('▼ regressed')) }

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
})

type CaseSummary = {
    caseNumber: number
    pass: number
    fail: number
    verdict: Verdict
    costUsd: number | null
}

type RanDataset = {
    name: string
    cases: EvalCase[]
    results: CaseResult[]
    baselineRead: BaselineRead
    changedTools: string[] | null
}

type BaselineRead =
    | { kind: 'found', baseline: Baseline }
    | { kind: 'missing' }
    | { kind: 'error', message: string }
    | { kind: 'skipped' }

type DiffLabel = 'same' | 'unclear' | 'FIXED' | 'REGRESSED'

type DatasetOutcome = {
    status: 'ok' | 'unchecked' | 'broken'
    reason: string
}

type PlannedRun = {
    candidate: EvalCase
    trial: number
}

type CaseResult = UploadedRun & {
    newFixtures: RecordedToolCall[]
}
