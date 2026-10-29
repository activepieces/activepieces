import { spreadIfDefined } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import pLimit from 'p-limit'
import { ChatEvalFixture } from '../core/fixture'
import { evalFixtures } from '../core/fixtures-loader'
import { evalPrompts, PromptSources } from '../core/prompts'
import { agentEvalRunner } from '../core/runner'
import { EvalReportEntry } from '../core/report'
import { evalStore, FixtureComparison, PartialEntry, RunResult } from './store'

function deltaOf({ baselinePassed, candidatePassed }: { baselinePassed: boolean, candidatePassed: boolean }): FixtureComparison['delta'] {
    if (candidatePassed && !baselinePassed) {
        return 'improved'
    }
    if (!candidatePassed && baselinePassed) {
        return 'regressed'
    }
    return 'same'
}

async function run({ candidatePath, baselineModelId, candidateModelId, only, limit, fresh = false, concurrency = DEFAULT_CONCURRENCY, maxCostUsd, onProgress }: RunParams): Promise<RunOutcome> {
    const fixtures = selectFixtures({ fixtures: evalFixtures.load(), only, limit })
    const sources = evalPrompts.resolveSources({ candidatePath })
    const first = fixtures[0]
    const runKey = hashOf({ sources, baselineModelId, candidateModelId, repeats: agentEvalRunner.repeatsFromEnv(), judgeModelId: agentEvalRunner.judgeModelId() })
    if (fresh) {
        evalStore.clearPartial()
    }
    const saved = savedEntries({ runKey })
    const selected = new Set(fixtures.map((fixture) => fixture.id))
    const unselected = saved.filter((entry) => !selected.has(entry.comparison.id))
    const done = new Map(resumableEntries({ entries: saved, fixtures }).map((entry) => [entry.comparison.id, entry]))
    const resumed = done.size
    const running = new Map<string, RunningFixture>()
    let spentUsd = [...done.values()].reduce((total, entry) => total + entry.spentUsd, 0)
    const report = (finished?: PartialEntry): void => onProgress?.({ done: done.size, total: fixtures.length, resumed, spentUsd, maxCostUsd, running: [...running.values()], ...spreadIfDefined('finished', finished) })
    const pool = pLimit(concurrency)
    report()

    try {
        await Promise.all(fixtures.filter((fixture) => !done.has(fixture.id)).map((fixture) => pool(async () => {
            if (maxCostUsd !== undefined && spentUsd >= maxCostUsd) {
                return
            }
            const startedAt = Date.now()
            const onStage = ({ modelId, stage }: { modelId: string, stage: string }): void => {
                running.set(fixture.id, { id: fixture.id, modelId, stage, startedAt })
                report()
            }
            const entry = await evaluatePair({ fixture, sources, baselineModelId, candidateModelId, onStage }).finally(() => running.delete(fixture.id))
            done.set(fixture.id, entry)
            spentUsd += entry.spentUsd
            evalStore.writePartial({ runKey, entries: [...unselected, ...done.values()] })
            report(entry)
        })))
    }
    finally {
        await agentEvalRunner.cleanupAuth()
    }

    const comparisons = fixtures.flatMap((fixture) => done.get(fixture.id)?.comparison ?? [])
    const remaining = fixtures.length - comparisons.length
    const uncosted = fixtures.filter((fixture) => done.get(fixture.id)?.costComplete === false).map((fixture) => fixture.id)
    const result = {
        at: new Date().toISOString(),
        provider: first?.model.provider ?? 'openrouter',
        baselineModelId: baselineModelId ?? first?.model.modelId ?? '',
        candidateModelId: candidateModelId ?? first?.model.modelId ?? '',
        baselineLabel: sources.baseline.label,
        candidateLabel: sources.candidate.label,
        promptChanged: sources.changed,
        comparisons,
    }
    if (remaining > 0) {
        return { run: { ...result, version: evalStore.runFormatVersion }, remaining, spentUsd, uncosted }
    }
    const written = evalStore.writeRun(result)
    if (unselected.length > 0) {
        evalStore.writePartial({ runKey, entries: unselected })
    }
    else {
        evalStore.clearPartial()
    }
    return { run: written, remaining, spentUsd, uncosted }
}

async function evaluatePair({ fixture, sources, baselineModelId, candidateModelId, onStage }: { fixture: ChatEvalFixture, sources: PromptSources, baselineModelId?: string, candidateModelId?: string, onStage: (stage: { modelId: string, stage: string }) => void }): Promise<PartialEntry> {
    const baselineModel = baselineModelId ?? fixture.model.modelId
    const candidateModel = candidateModelId ?? fixture.model.modelId
    const baseline = await agentEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.baseline.systemPrompt, guides: sources.baseline.guides, modelId: baselineModel, onStage: (stage) => onStage({ modelId: baselineModel, stage }) })
    let candidate = baseline
    if (sources.changed || baselineModel !== candidateModel) {
        candidate = await agentEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.candidate.systemPrompt, guides: sources.candidate.guides, modelId: candidateModel, onStage: (stage) => onStage({ modelId: candidateModel, stage }) })
    }
    const arms = candidate === baseline ? [baseline] : [baseline, candidate]
    return {
        fixtureHash: hashOf(fixture),
        spentUsd: arms.reduce((total, arm) => total + spentOn(arm), 0),
        costComplete: arms.every((arm) => arm.costUsd !== null && arm.judgeCostUsd !== null),
        comparison: { id: fixture.id, baseline, candidate, delta: deltaOf({ baselinePassed: baseline.passed, candidatePassed: candidate.passed }) },
    }
}

function savedEntries({ runKey }: { runKey: string }): PartialEntry[] {
    const partial = evalStore.readPartial()
    return partial?.runKey === runKey ? partial.entries : []
}

function resumableEntries({ entries, fixtures }: { entries: PartialEntry[], fixtures: ChatEvalFixture[] }): PartialEntry[] {
    const hashes = new Map(fixtures.map((fixture) => [fixture.id, hashOf(fixture)]))
    return entries.filter((entry) => hashes.get(entry.comparison.id) === entry.fixtureHash)
}

function spentOn(arm: EvalReportEntry): number {
    return arm.knownCostUsd + (arm.judgeCostUsd ?? 0)
}

function hashOf(value: unknown): string {
    return cryptoUtils.hashSHA256(JSON.stringify(value))
}

function selectFixtures({ fixtures, only, limit }: { fixtures: ChatEvalFixture[], only?: string[], limit?: number }): ChatEvalFixture[] {
    const unknown = (only ?? []).filter((id) => !fixtures.some((fixture) => fixture.id === id))
    if (unknown.length > 0) {
        throw new Error(`Unknown fixture id(s): ${unknown.join(', ')}`)
    }
    const picked = only === undefined ? fixtures : fixtures.filter((fixture) => only.includes(fixture.id))
    return limit === undefined ? picked : picked.slice(0, limit)
}

const DEFAULT_CONCURRENCY = 4

export const evalRun = {
    run,
}

export type RunParams = {
    candidatePath?: string
    baselineModelId?: string
    candidateModelId?: string
    only?: string[]
    limit?: number
    fresh?: boolean
    concurrency?: number
    maxCostUsd?: number
    onProgress?: (progress: RunProgress) => void
}

export type RunProgress = {
    done: number
    total: number
    resumed: number
    spentUsd: number
    maxCostUsd?: number
    running: RunningFixture[]
    finished?: PartialEntry
}

export type RunningFixture = {
    id: string
    modelId: string
    stage: string
    startedAt: number
}

export type RunOutcome = {
    run: RunResult
    remaining: number
    spentUsd: number
    uncosted: string[]
}
