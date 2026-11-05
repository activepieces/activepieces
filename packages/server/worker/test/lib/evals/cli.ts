import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { chunk, tryCatch } from '@activepieces/core-utils'
import { ToolSet } from 'ai'
import { z } from 'zod'
import { evalAgentTurn } from './agent-turn'
import { CheckResult, evalChecks, Verdict } from './checks'
import { evalCase, EvalCase, RecordedToolCall, ToolFixture } from './eval-case'
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
            'save-fixtures': { type: 'boolean', default: false },
        },
    })
    if (values['save-fixtures']) {
        await saveFixtures()
        return
    }
    const recordMode = values.record
    const onlyCases = new Set((values.case ?? []).map(Number))
    const items = await posthogDataset.loadItems({ datasetName: values.dataset })
    const cases = items
        .map((item) => evalCase.fromDatasetItem(item))
        .filter((candidate) => onlyCases.size === 0 || onlyCases.has(candidate.caseNumber))
        .sort((a, b) => a.caseNumber - b.caseNumber)
    console.log(`${cases.length} case(s) from "${values.dataset}" · model ${values.model} · judge ${evalChecks.judgeModelId()} · ${recordMode ? 'RECORD mode: missing reads run live' : 'fixtures only'} · nothing is uploaded`)

    const auth = await evalAgentTurn.resolveAuth()
    const mcp = await evalToolSet.connectMcp({ conversationId: EVAL_CONVERSATION_ID })
    const results = await runInBatches({ cases, verbose: values.verbose, run: (candidate) => evaluate({ candidate, mcpToolSet: mcp.toolSet, modelId: values.model, auth, recordMode }) })
        .finally(async () => {
            await mcp.close().catch(() => undefined)
            await evalAgentTurn.cleanupAuth()
        })

    const count = (verdict: Verdict): number => results.filter((result) => result.verdict === verdict).length
    console.log(`\n${count('pass')} pass · ${count('fail')} fail · ${count('no_verdict')} no verdict · ${results.length} cases`)
    if (recordMode) {
        writePending({ results })
    }
    process.exit(count('fail') === 0 ? 0 : 1)
}

async function runInBatches({ cases, verbose, run }: { cases: EvalCase[], verbose: boolean, run: (candidate: EvalCase) => Promise<CaseResult> }): Promise<CaseResult[]> {
    const results: CaseResult[] = []
    for (const batch of chunk(cases, CONCURRENCY)) {
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

function writePending({ results }: { results: CaseResult[] }): void {
    const pending = results.filter((result) => result.newFixtures.length > 0)
    if (pending.length === 0) {
        console.log('No new fixtures were recorded.')
        return
    }
    writeFileSync(PENDING_FILE, JSON.stringify(pending.map((result) => ({ itemId: result.candidate.id, caseNumber: result.candidate.caseNumber, fixtures: result.newFixtures })), null, 2))
    console.log(`\nRecorded ${pending.reduce((total, result) => total + result.newFixtures.length, 0)} new fixture(s), not saved yet:`)
    pending.forEach((result) => result.newFixtures.forEach((fixture) => console.log(`    case ${result.candidate.caseNumber}: ${fixture.toolName} ${JSON.stringify(fixture.input).slice(0, PREVIEW_CHARS)}`)))
    console.log(`Review them in ${PENDING_FILE}, then run with --save-fixtures to add them to the dataset items.`)
}

async function saveFixtures(): Promise<void> {
    if (!existsSync(PENDING_FILE)) {
        console.log('Nothing to save. Run with --record first.')
        return
    }
    const pending = PendingFixtures.parse(JSON.parse(readFileSync(PENDING_FILE, 'utf-8')))
    for (const entry of pending) {
        const total = await posthogDataset.addFixtures({ itemId: entry.itemId, fixtures: entry.fixtures })
        console.log(`case ${entry.caseNumber}: added ${entry.fixtures.length} fixture(s), ${total} in total`)
    }
    rmSync(PENDING_FILE)
}

function print({ result, verbose }: { result: CaseResult, verbose: boolean }): void {
    console.log(`\n${VERDICT_MARK[result.verdict]} case ${result.candidate.caseNumber} [${result.candidate.problemType}]`)
    if (verbose) {
        console.log(`    history: ${result.candidate.history.length} message(s) · fixtures: ${result.candidate.recordedToolCalls.map((call) => call.toolName).join(', ') || 'none'}`)
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
const PENDING_FILE = path.join(tmpdir(), 'ap-evals-pending-fixtures.json')
const DEFAULT_MODEL = 'z-ai/glm-5.3'
const DEFAULT_DATASET = 'chat-regressions'
const EVAL_CONVERSATION_ID = 'eval-conversation'
const CONCURRENCY = 4
const PREVIEW_CHARS = 120
const VERDICT_MARK: Record<Verdict, string> = { pass: '✓', fail: '✗', no_verdict: '?' }
const VERDICT_LABEL: Record<Verdict, string> = { pass: 'pass', fail: 'FAIL', no_verdict: 'no verdict' }

const PendingFixtures = z.array(z.object({ itemId: z.string(), caseNumber: z.number(), fixtures: z.array(ToolFixture) }))

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
})

type CaseResult = {
    candidate: EvalCase
    verdict: Verdict
    checks: CheckResult[]
    stops: string[]
    transcript: string
    newFixtures: RecordedToolCall[]
}
