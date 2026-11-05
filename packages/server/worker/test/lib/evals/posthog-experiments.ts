import { randomUUID } from 'node:crypto'
import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { CheckResult, Verdict } from './checks'
import { EvalCase } from './eval-case'
import { posthogDataset } from './posthog-dataset'

async function upload({ runs, suiteKey, runSource, applicationVersion, modelVersion, promptVersion }: UploadParams): Promise<string> {
    const scorers = await ensureScorers()
    const id = randomUUID()
    const uploaded = runs.map((run) => ({ run, itemId: randomUUID() }))
    const results = uploaded.flatMap(({ run, itemId }) => resultsFor({ run, itemId, scorers }))
    await posthogDataset.request({
        path: EXPERIMENTS_PATH,
        method: 'POST',
        body: {
            id,
            name: `${suiteKey} · ${applicationVersion.slice(0, SHORT_SHA)} · ${modelVersion}`,
            started_at: new Date().toISOString(),
            run_source: runSource,
            suite_key: suiteKey,
            application_version: applicationVersion,
            model_version: modelVersion,
            prompt_version: promptVersion,
            expected_item_count: uploaded.length,
            expected_result_count: results.length,
        },
    })
    for (let start = 0; start < results.length; start += UPLOAD_BATCH) {
        const batch = results.slice(start, start + UPLOAD_BATCH)
        const itemIds = new Set(batch.map((result) => result.item_id))
        await posthogDataset.request({
            path: `${EXPERIMENTS_PATH}${id}/upload/`,
            method: 'POST',
            body: { items: uploaded.filter(({ itemId }) => itemIds.has(itemId)).map(({ run, itemId }) => itemFor({ run, itemId })), results: batch },
        })
    }
    await posthogDataset.request({ path: `${EXPERIMENTS_PATH}${id}/complete/`, method: 'POST', body: {} })
    return id
}

async function baseline({ suiteKey, modelVersion }: { suiteKey: string, modelVersion: string }): Promise<Baseline | null> {
    const list = ExperimentPage.parse(await posthogDataset.request({ path: EXPERIMENTS_PATH, query: { suite_key: suiteKey, model_version: modelVersion, statuses: 'completed', limit: '1' } }))
    const latest = list.results[0]
    if (isNil(latest)) {
        return null
    }
    const scorers = await ensureScorers()
    const items = await collectItems({ experimentId: latest.id, cursor: undefined, collected: [] })
    const passedByItem = new Map<string, boolean>()
    for (let start = 0; start < items.length; start += CELLS_BATCH) {
        const batch = items.slice(start, start + CELLS_BATCH)
        const cells = ResultCells.parse(await posthogDataset.request({
            path: `${EXPERIMENTS_PATH}${latest.id}/result_cells/`,
            query: { item_ids: batch.map((item) => item.id).join(','), scorer_version_ids: scorers.casePassed },
        }))
        cells.results.forEach((cell) => {
            if (cell.status === 'ok' && typeof cell.value === 'boolean') {
                passedByItem.set(cell.item_id, cell.value)
            }
        })
    }
    const counts = new Map<string, VerdictCounts>()
    for (const caseKey of new Set(items.map((item) => item.case_key))) {
        const values = items.filter((item) => item.case_key === caseKey).flatMap((item) => passedByItem.has(item.id) ? [passedByItem.get(item.id) === true] : [])
        counts.set(caseKey, { pass: values.filter(Boolean).length, fail: values.filter((value) => !value).length })
    }
    return { experimentId: latest.id, applicationVersion: latest.application_version ?? 'unknown', counts }
}

function caseKey(candidate: EvalCase): string {
    return `case-${candidate.caseNumber}`
}

async function collectItems({ experimentId, cursor, collected }: { experimentId: string, cursor: string | undefined, collected: ExperimentItem[] }): Promise<ExperimentItem[]> {
    const page = ItemPage.parse(await posthogDataset.request({ path: `${EXPERIMENTS_PATH}${experimentId}/items/`, query: { limit: String(PAGE_SIZE), ...(isNil(cursor) ? {} : { cursor }) } }))
    const items = [...collected, ...page.results]
    return isNil(page.next_cursor) ? items : collectItems({ experimentId, cursor: page.next_cursor, collected: items })
}

function itemFor({ run, itemId }: { run: UploadedRun, itemId: string }): Record<string, unknown> {
    return {
        id: itemId,
        case_key: caseKey(run.candidate),
        trial: String(run.trial),
        dataset_item_identifier: run.candidate.id,
        payload: {
            input: { userMessage: run.candidate.userMessage, cutBeforeStep: run.candidate.cutBeforeStep ?? null, targetTool: run.candidate.targetTool ?? null },
            output: run.transcript.slice(0, TRANSCRIPT_MAX_CHARS),
            metadata: { problemType: run.candidate.problemType, stops: run.stops },
        },
    }
}

function resultsFor({ run, itemId, scorers }: { run: UploadedRun, itemId: string, scorers: Scorers }): Record<string, unknown>[] {
    const codeCheck = run.checks.find((check) => check.name === CODE_CHECK_NAME)
    const judged = run.checks.filter((check) => check.name !== CODE_CHECK_NAME)
    return [
        result({ itemId, scorerVersionId: scorers.casePassed, verdict: run.verdict, reasoning: run.checks.filter((check) => check.verdict !== 'pass').map((check) => `${check.name}: ${check.reason}`).join('\n') }),
        isNil(codeCheck) ? notApplicable({ itemId, scorerVersionId: scorers.toolInputValid }) : result({ itemId, scorerVersionId: scorers.toolInputValid, verdict: codeCheck.verdict, reasoning: codeCheck.reason }),
        judged.length === 0 ? notApplicable({ itemId, scorerVersionId: scorers.judgeCheck }) : result({ itemId, scorerVersionId: scorers.judgeCheck, verdict: combined(judged), reasoning: judged.map((check) => check.reason).join('\n') }),
    ]
}

function combined(checks: CheckResult[]): Verdict {
    return checks.some((check) => check.verdict === 'fail') ? 'fail' : 'pass'
}

function result({ itemId, scorerVersionId, verdict, reasoning }: { itemId: string, scorerVersionId: string, verdict: Verdict, reasoning: string }): Record<string, unknown> {
    return { item_id: itemId, scorer_version_id: scorerVersionId, status: 'ok', value: verdict === 'pass', evaluated_at: new Date().toISOString(), payload: { reasoning } }
}

function notApplicable({ itemId, scorerVersionId }: { itemId: string, scorerVersionId: string }): Record<string, unknown> {
    return { item_id: itemId, scorer_version_id: scorerVersionId, status: 'not_applicable', value: null, evaluated_at: new Date().toISOString() }
}

async function ensureScorers(): Promise<Scorers> {
    const [casePassed, toolInputValid, judgeCheck] = await Promise.all(SCORER_NAMES.map((name) => ensureScorer({ name })))
    return { casePassed, toolInputValid, judgeCheck }
}

async function ensureScorer({ name }: { name: string }): Promise<string> {
    const existing = ScorerPage.parse(await posthogDataset.request({ path: SCORERS_PATH, query: { search: name, limit: '100' } })).results.find((scorer) => scorer.name === name && !scorer.archived)
    if (!isNil(existing)) {
        return existing.current_version_id
    }
    const created = Scorer.parse(await posthogDataset.request({
        path: SCORERS_PATH,
        method: 'POST',
        body: { name, kind: 'boolean', description: `Offline chat eval (${name}). Written by bun run evals --upload.`, config: { true_label: 'Pass', false_label: 'Fail', true_is_failure: false } },
    }))
    return created.current_version_id
}

const EXPERIMENTS_PATH = '/ai_observability/offline_experiments/'
const SCORERS_PATH = '/llm_analytics/score_definitions/'
const SCORER_NAMES = ['Chat eval: case passed', 'Chat eval: no rejected tool input', 'Chat eval: judge check']
const CODE_CHECK_NAME = 'no rejected tool input'
const UPLOAD_BATCH = 1_000
const CELLS_BATCH = 50
const PAGE_SIZE = 100
const SHORT_SHA = 8
const TRANSCRIPT_MAX_CHARS = 20_000

const Scorer = z.object({ id: z.string(), name: z.string(), archived: z.boolean(), current_version_id: z.string() })
const ScorerPage = z.object({ results: z.array(Scorer) })
const ExperimentPage = z.object({ results: z.array(z.object({ id: z.string(), application_version: z.string().nullable() })) })
const ExperimentItem = z.object({ id: z.string(), case_key: z.string() })
const ItemPage = z.object({ next_cursor: z.string().nullable(), results: z.array(ExperimentItem) })
const ResultCells = z.object({ results: z.array(z.object({ item_id: z.string(), status: z.string(), value: z.unknown() })) })

export const posthogExperiments = {
    upload,
    baseline,
    caseKey,
}

type Scorers = { casePassed: string, toolInputValid: string, judgeCheck: string }

type ExperimentItem = z.infer<typeof ExperimentItem>

export type UploadedRun = {
    candidate: EvalCase
    trial: number
    verdict: Verdict
    checks: CheckResult[]
    stops: string[]
    transcript: string
}

export type VerdictCounts = {
    pass: number
    fail: number
}

export type Baseline = {
    experimentId: string
    applicationVersion: string
    counts: Map<string, VerdictCounts>
}

type UploadParams = {
    runs: UploadedRun[]
    suiteKey: string
    runSource: 'ci' | 'local'
    applicationVersion: string
    modelVersion: string
    promptVersion: string
}
