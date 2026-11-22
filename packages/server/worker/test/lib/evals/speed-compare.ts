import { readFile, writeFile } from 'node:fs/promises'
import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { RunScores, RunVerdict } from './checks'
import { colors } from './colors'

async function save({ path, datasets }: { path: string, datasets: SnapshotDataset[] }): Promise<void> {
    const cases = datasets.flatMap(({ name, cases: datasetCases, results }) => datasetCases.map((candidate) => ({
        dataset: name,
        caseId: candidate.id,
        title: candidate.title,
        runs: results.filter((result) => result.candidate.id === candidate.id).map(({ verdict, scores }) => ({
            verdict,
            gates: { expected: scores.expected, honest: scores.honest, validToolCalls: scores.validToolCalls },
            speed: scores.speed,
            reasons: scores.reasons,
            judge: scores.judge,
        })),
    })))
    await writeFile(path, JSON.stringify({ cases }, null, 2))
}

async function load(path: string): Promise<SavedRuns> {
    return SavedRunsSchema.parse(JSON.parse(await readFile(path, 'utf-8')))
}

function compare({ before, after }: { before: SavedRuns, after: SavedRuns }): SpeedComparison {
    const rows = before.cases.flatMap((beforeCase) => {
        const afterCase = after.cases.find((candidate) => candidate.dataset === beforeCase.dataset && candidate.caseId === beforeCase.caseId)
        if (isNil(afterCase)) {
            return []
        }
        const beforeStats = caseStats(beforeCase)
        const afterStats = caseStats(afterCase)
        return [{ dataset: beforeCase.dataset, title: beforeCase.title, metrics: METRIC_NAMES.map((name) => ({ name, before: beforeStats[name], after: afterStats[name] })) }]
    })
    const totals = METRIC_NAMES.map((name, index) => {
        const paired = rows.flatMap((row) => {
            const { before, after } = row.metrics[index]
            return isNil(before) || isNil(after) ? [] : [{ before, after }]
        })
        return { name, before: median(paired.map((pair) => pair.before)), after: median(paired.map((pair) => pair.after)), excluded: rows.length - paired.length }
    })
    return { rows, totals }
}

function print(comparison: SpeedComparison): void {
    if (comparison.rows.length === 0) {
        console.log(colors.yellow('No case appears in both files.'))
        return
    }
    comparison.rows.forEach((row) => {
        console.log(`\n${colors.bold(`${row.dataset} · ${row.title}`)}`)
        row.metrics.forEach((metric) => console.log(metricLine(metric)))
    })
    console.log(`\n${colors.bold(`Totals (median across ${comparison.rows.length} case(s))`)}`)
    comparison.totals.forEach((metric) => console.log(`${metricLine(metric)}${metric.excluded > 0 ? colors.dim(`  (${metric.excluded} of ${comparison.rows.length} case(s) excluded: no value on both sides)`) : ''}`))
}

function caseStats(savedCase: SavedCase): Record<MetricName, number | null> {
    const speeds = savedCase.runs.flatMap((run) => nonNil(run.speed))
    const judged = savedCase.runs.filter((run) => run.verdict !== 'unknown')
    return {
        'pass rate %': judged.length === 0 ? null : 100 * judged.filter((run) => run.verdict === 'pass').length / judged.length,
        'turn seconds': median(speeds.map((speed) => speed.totalMs / 1000)),
        'model calls': median(speeds.map((speed) => speed.modelCalls)),
        'tool calls': median(speeds.map((speed) => speed.toolCalls)),
        'wasted calls': median(speeds.map((speed) => speed.wasted.rejectedInputs + speed.wasted.repeatedPieceProps + speed.wasted.fixRoundsAfterBuild)),
        'first build seconds': median(speeds.flatMap((speed) => isNil(speed.firstBuildMs) ? [] : [speed.firstBuildMs / 1000])),
        'tokens in+out': median(speeds.flatMap((speed) => isNil(speed.inputTokens) && isNil(speed.outputTokens) ? [] : [(speed.inputTokens ?? 0) + (speed.outputTokens ?? 0)])),
    }
}

function median(values: number[]): number | null {
    if (values.length === 0) {
        return null
    }
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function percentChange({ before, after }: { before: number | null, after: number | null }): number | null {
    if (isNil(before) || isNil(after) || before === 0) {
        return null
    }
    return 100 * (after - before) / before
}

function nonNil<T>(value: T | null): T[] {
    return isNil(value) ? [] : [value]
}

function metricLine(metric: MetricComparison): string {
    const change = percentChange(metric)
    const higherIsBetter = metric.name === 'pass rate %'
    const better = !isNil(change) && (higherIsBetter ? change > 0 : change < 0)
    const worse = !isNil(change) && (higherIsBetter ? change < 0 : change > 0)
    const changeText = isNil(change) ? '' : `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
    const painted = better ? colors.green(changeText) : worse ? colors.red(changeText) : colors.dim(changeText)
    return `  ${metric.name.padEnd(20)} ${formatValue(metric.before).padStart(9)} → ${formatValue(metric.after).padEnd(9)} ${painted}`
}

function formatValue(value: number | null): string {
    if (isNil(value)) {
        return 'n/a'
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const METRIC_NAMES = ['pass rate %', 'turn seconds', 'model calls', 'tool calls', 'wasted calls', 'first build seconds', 'tokens in+out'] as const

const RunVerdictSchema = z.enum(['pass', 'fail', 'unknown'])

const SavedRunsSchema = z.object({
    cases: z.array(z.object({
        dataset: z.string(),
        caseId: z.string(),
        title: z.string(),
        runs: z.array(z.object({
            verdict: RunVerdictSchema,
            gates: z.object({ expected: RunVerdictSchema, honest: RunVerdictSchema, validToolCalls: RunVerdictSchema }),
            speed: z.object({
                totalMs: z.number(),
                modelCalls: z.number(),
                toolCalls: z.number(),
                inputTokens: z.number().nullable(),
                outputTokens: z.number().nullable(),
                wasted: z.object({ rejectedInputs: z.number(), repeatedPieceProps: z.number(), fixRoundsAfterBuild: z.number() }),
                firstBuildMs: z.number().nullable(),
            }).nullable(),
        })),
    })),
})

export const speedCompare = {
    save,
    load,
    compare,
    print,
    median,
    percentChange,
}

export type SavedRuns = z.infer<typeof SavedRunsSchema>

type SavedCase = SavedRuns['cases'][number]

type MetricName = typeof METRIC_NAMES[number]

type MetricComparison = { name: MetricName, before: number | null, after: number | null }

type SpeedComparison = {
    rows: { dataset: string, title: string, metrics: MetricComparison[] }[]
    totals: (MetricComparison & { excluded: number })[]
}

type SnapshotDataset = {
    name: string
    cases: { id: string, title: string }[]
    results: { candidate: { id: string }, verdict: RunVerdict, scores: RunScores }[]
}
