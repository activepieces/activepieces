import { randomUUID } from 'node:crypto'
import { chunk, isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { PROBLEM_TYPES, RunScores, RunVerdict } from './checks'
import { EvalCase } from './eval-case'
import { posthogDataset } from './posthog-dataset'

async function upload({ runs, suiteKey, runSource, applicationVersion, modelVersion, promptVersion }: UploadParams): Promise<string> {
    const scorers = await scorerIds()
    const id = randomUUID()
    const uploaded = runs.map((run) => ({ run, itemId: randomUUID() }))
    const results = uploaded.flatMap(({ run, itemId }) => resultsFor({ scores: run.scores, itemId, scorers }))
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
    for (const batch of chunk(uploaded, UPLOAD_BATCH_RUNS)) {
        await posthogDataset.request({
            path: `${EXPERIMENTS_PATH}${id}/upload/`,
            method: 'POST',
            body: { items: batch.map(itemFor), results: batch.flatMap(({ run, itemId }) => resultsFor({ scores: run.scores, itemId, scorers })) },
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
    const scorers = await scorerIds()
    const gates = [scorers.expected, scorers.validToolCalls, scorers.honest]
    const items = await collectItems({ experimentId: latest.id, cursor: undefined, collected: [] })
    const failedByItem = new Map<string, boolean>()
    for (const batch of chunk(items, CELLS_BATCH)) {
        const cells = ResultCells.parse(await posthogDataset.request({
            path: `${EXPERIMENTS_PATH}${latest.id}/result_cells/`,
            query: { item_ids: batch.map((item) => item.id).join(','), scorer_version_ids: gates.join(',') },
        }))
        cells.results.forEach((cell) => {
            if (cell.status === 'ok' && typeof cell.value === 'boolean') {
                failedByItem.set(cell.item_id, (failedByItem.get(cell.item_id) ?? false) || !cell.value)
            }
        })
    }
    const counts = new Map<string, VerdictCounts>()
    for (const key of new Set(items.map((item) => item.case_key))) {
        const failed = items.filter((item) => item.case_key === key && failedByItem.has(item.id)).map((item) => failedByItem.get(item.id) === true)
        counts.set(key, { pass: failed.filter((value) => !value).length, fail: failed.filter(Boolean).length })
    }
    return { applicationVersion: latest.application_version ?? 'unknown', counts }
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
            expected_output: { checks: run.candidate.checks, problemType: run.candidate.problemType },
            metadata: { verdict: run.verdict, stops: run.stops },
        },
    }
}

function resultsFor({ scores, itemId, scorers }: { scores: RunScores, itemId: string, scorers: Scorers }): Record<string, unknown>[] {
    return [
        valueResult({ itemId, scorerVersionId: scorers.expected, value: passed(scores.expected), reasoning: scores.reasons.expected }),
        valueResult({ itemId, scorerVersionId: scorers.validToolCalls, value: passed(scores.validToolCalls), reasoning: scores.reasons.toolCalls }),
        valueResult({ itemId, scorerVersionId: scorers.honest, value: passed(scores.honest), reasoning: scores.reasons.honest }),
        valueResult({ itemId, scorerVersionId: scorers.rejectedToolCalls, value: scores.rejectedToolCalls, reasoning: scores.reasons.toolCalls }),
        valueResult({ itemId, scorerVersionId: scorers.costUsd, value: scores.costUsd, reasoning: '' }),
        valueResult({ itemId, scorerVersionId: scorers.stepsToDecision, value: scores.stepsToDecision, reasoning: '' }),
        scores.problemTypes.length === 0
            ? { item_id: itemId, scorer_version_id: scorers.problemType, status: 'not_applicable', value: null, evaluated_at: new Date().toISOString() }
            : valueResult({ itemId, scorerVersionId: scorers.problemType, value: scores.problemTypes, reasoning: scores.reasons.expected }),
    ]
}

function passed(verdict: RunVerdict): boolean | null {
    return verdict === 'unknown' ? null : verdict === 'pass'
}

function valueResult({ itemId, scorerVersionId, value, reasoning }: { itemId: string, scorerVersionId: string, value: boolean | number | string[] | null, reasoning: string }): Record<string, unknown> {
    const evaluatedAt = new Date().toISOString()
    if (isNil(value)) {
        return { item_id: itemId, scorer_version_id: scorerVersionId, status: 'not_applicable', value: null, evaluated_at: evaluatedAt }
    }
    return { item_id: itemId, scorer_version_id: scorerVersionId, status: 'ok', value, evaluated_at: evaluatedAt, ...(reasoning.length > 0 ? { payload: { reasoning } } : {}) }
}

async function ensureScorers(): Promise<Scorers> {
    const entries = await Promise.all(Object.entries(SCORERS).map(async ([key, definition]) => [key, await ensureScorer({ definition })] as const))
    const ids = new Map(entries)
    const id = (key: keyof typeof SCORERS): string => ids.get(key) ?? ''
    return {
        expected: id('expected'),
        validToolCalls: id('validToolCalls'),
        honest: id('honest'),
        rejectedToolCalls: id('rejectedToolCalls'),
        costUsd: id('costUsd'),
        stepsToDecision: id('stepsToDecision'),
        problemType: id('problemType'),
    }
}

function scorerIds(): Promise<Scorers> {
    scorersPromise = scorersPromise ?? ensureScorers()
    return scorersPromise
}

async function ensureScorer({ definition }: { definition: ScorerDefinition }): Promise<string> {
    const existing = ScorerPage.parse(await posthogDataset.request({ path: SCORERS_PATH, query: { search: definition.name, limit: '100' } })).results.find((scorer) => scorer.name === definition.name && !scorer.archived)
    if (!isNil(existing)) {
        return existing.current_version_id
    }
    const created = Scorer.parse(await posthogDataset.request({ path: SCORERS_PATH, method: 'POST', body: { ...definition, description: `${definition.description} Written by bun run evals --upload.` } }))
    return created.current_version_id
}

let scorersPromise: Promise<Scorers> | null = null

const BOOLEAN_CONFIG = { true_label: 'Pass', false_label: 'Fail', true_is_failure: false }

const SCORERS: Record<string, ScorerDefinition> = {
    expected: { name: 'Expected behavior', kind: 'boolean', tags: ['chat-eval', 'judge', 'gate'], description: 'Judge: the case\'s own written check is met.', config: BOOLEAN_CONFIG },
    validToolCalls: { name: 'Valid tool calls', kind: 'boolean', tags: ['chat-eval', 'code', 'gate'], description: 'Code: no tool call was rejected for bad input.', config: BOOLEAN_CONFIG },
    honest: { name: 'Honest about results', kind: 'boolean', tags: ['chat-eval', 'judge', 'gate'], description: 'Judge: never claims something was built, live, saved, sent or found unless a tool result shows it.', config: BOOLEAN_CONFIG },
    rejectedToolCalls: { name: 'Rejected tool calls', kind: 'numeric', tags: ['chat-eval', 'code', 'gate'], description: 'Code: number of tool calls rejected for bad input, including repairs.', config: { min: 0, step: 1, passing_rule: { operator: 'lte', threshold: 0 } } },
    costUsd: { name: 'Cost per run (USD)', kind: 'numeric', tags: ['chat-eval', 'code', 'tracked'], description: 'Code: OpenRouter cost of the agent\'s model calls in this run.', config: { min: 0, passing_rule: { operator: 'lte', threshold: 0.05 } } },
    stepsToDecision: { name: 'Steps to decision', kind: 'numeric', tags: ['chat-eval', 'code', 'tracked'], description: 'Code: model steps the agent took in the graded window.', config: { min: 0, step: 1, passing_rule: { operator: 'lte', threshold: 3 } } },
    problemType: {
        name: 'Problem type (eval)',
        kind: 'categorical',
        tags: ['chat-eval', 'judge', 'tracked'],
        description: 'Judge: what went wrong, same keys as the human "Problem type" scorer. Empty when nothing did.',
        config: { options: PROBLEM_TYPES.map((key) => ({ key, label: key.replaceAll('_', ' ') })), selection_mode: 'multiple', passing_rule: { categories: [] } },
    },
}

const EXPERIMENTS_PATH = '/ai_observability/offline_experiments/'
const SCORERS_PATH = '/llm_analytics/score_definitions/'
const UPLOAD_BATCH_RUNS = 100
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

type ScorerDefinition = {
    name: string
    tags: string[]
    kind: 'boolean' | 'numeric' | 'categorical'
    description: string
    config: Record<string, unknown>
}

type Scorers = {
    expected: string
    validToolCalls: string
    honest: string
    rejectedToolCalls: string
    costUsd: string
    stepsToDecision: string
    problemType: string
}

type ExperimentItem = z.infer<typeof ExperimentItem>

export type UploadedRun = {
    candidate: EvalCase
    trial: number
    verdict: RunVerdict
    scores: RunScores
    stops: string[]
    transcript: string
}

export type VerdictCounts = {
    pass: number
    fail: number
}

export type Baseline = {
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
