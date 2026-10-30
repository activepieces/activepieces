import { AIProviderName } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatEvalFixture } from '../core/fixture'
import { EvalReportEntry } from '../core/report'
import { evalRun, RunProgress } from './run'
import { PartialRun } from './store'

const state = vi.hoisted((): TestState => ({
    fixtures: [],
    partial: null,
    lastRunWrites: 0,
    inFlight: 0,
    maxInFlight: 0,
    evaluated: [],
    systemPrompt: 'prompt',
    costPerFixture: 1,
    crashedRepeatIds: [],
}))

vi.mock('../core/fixtures-loader', () => ({ evalFixtures: { load: () => state.fixtures } }))

vi.mock('../core/prompts', () => ({
    evalPrompts: {
        resolveSources: () => ({
            baseline: { label: 'baseline', systemPrompt: state.systemPrompt, guides: {} },
            candidate: { label: 'candidate', systemPrompt: state.systemPrompt, guides: {} },
            changed: false,
        }),
    },
}))

vi.mock('../core/runner', () => ({
    agentEvalRunner: {
        repeatsFromEnv: () => 1,
        judgeModelId: () => 'judge',
        cleanupAuth: async () => undefined,
        evaluateFixture: async ({ fixture, onStage }: { fixture: { id: string }, onStage?: (stage: string) => void }) => {
            onStage?.('agent turn, step 1')
            state.inFlight += 1
            state.maxInFlight = Math.max(state.maxInFlight, state.inFlight)
            await new Promise((resolve) => setTimeout(resolve, 5))
            state.inFlight -= 1
            state.evaluated.push(fixture.id)
            return entry({ id: fixture.id, costUsd: state.costPerFixture, crashedRepeat: state.crashedRepeatIds.includes(fixture.id) })
        },
    },
}))

vi.mock('./store', () => ({
    evalStore: {
        runFormatVersion: 2,
        readPartial: () => state.partial,
        writePartial: (partial: PartialRun) => {
            state.partial = partial
        },
        clearPartial: () => {
            state.partial = null
        },
        writeRun: (run: object) => {
            state.lastRunWrites += 1
            return { ...run, version: 2 }
        },
    },
}))

describe('evalRun.run', () => {
    beforeEach(() => {
        Object.assign(state, { fixtures: ['a', 'b', 'c', 'd', 'e', 'f'].map(fixture), partial: null, lastRunWrites: 0, inFlight: 0, maxInFlight: 0, evaluated: [], systemPrompt: 'prompt', costPerFixture: 1, crashedRepeatIds: [] })
    })

    it('never runs more fixtures at once than the concurrency limit', async () => {
        const outcome = await evalRun.run({ concurrency: 2 })

        expect(state.maxInFlight).toBe(2)
        expect(outcome.remaining).toBe(0)
        expect(outcome.run.comparisons.map((comparison) => comparison.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
        expect(state.lastRunWrites).toBe(1)
        expect(state.partial).toBeNull()
    })

    it('stops starting fixtures at the cost cap and keeps what finished for a resume', async () => {
        const outcome = await evalRun.run({ concurrency: 1, maxCostUsd: 2 })

        expect(state.evaluated).toEqual(['a', 'b'])
        expect(outcome.remaining).toBe(4)
        expect(outcome.spentUsd).toBe(2)
        expect(state.lastRunWrites).toBe(0)
        expect(state.partial?.entries.map((entry) => entry.comparison.id)).toEqual(['a', 'b'])

        state.evaluated = []
        const progress: RunProgress[] = []
        const resumed = await evalRun.run({ concurrency: 1, onProgress: (event) => progress.push(event) })

        expect(state.evaluated).toEqual(['c', 'd', 'e', 'f'])
        expect(resumed.remaining).toBe(0)
        expect(resumed.run.comparisons).toHaveLength(6)
        expect(progress[0]).toMatchObject({ done: 2, total: 6, resumed: 2, spentUsd: 2, running: [] })
        expect(progress[1].running.map((fixture) => [fixture.id, fixture.modelId, fixture.stage])).toEqual([['c', 'model', 'agent turn, step 1']])
        expect(progress.filter((event) => event.finished !== undefined).map((event) => event.finished?.comparison.id)).toEqual(['c', 'd', 'e', 'f'])
        expect(progress.at(-1)).toMatchObject({ done: 6, total: 6, spentUsd: 6, running: [] })
    })

    it('starts a stopped run over when asked for a fresh run', async () => {
        await evalRun.run({ concurrency: 1, maxCostUsd: 2 })
        state.evaluated = []

        await evalRun.run({ concurrency: 1, fresh: true })

        expect(state.evaluated).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })

    it('runs everything again when the prompt changed since the stopped run', async () => {
        await evalRun.run({ concurrency: 1, maxCostUsd: 2 })
        state.evaluated = []
        state.systemPrompt = 'edited prompt'

        await evalRun.run({ concurrency: 1 })

        expect(state.evaluated).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })

    it('runs an edited fixture again on resume', async () => {
        await evalRun.run({ concurrency: 1, maxCostUsd: 2 })
        state.evaluated = []
        state.fixtures = [{ ...fixture('a'), description: 'edited' }, ...state.fixtures.slice(1)]

        await evalRun.run({ concurrency: 1 })

        expect(state.evaluated).toEqual(['a', 'c', 'd', 'e', 'f'])
    })

    it('counts the known spend of a fixture whose repeat crashed toward the cap', async () => {
        state.crashedRepeatIds = ['a']

        const outcome = await evalRun.run({ concurrency: 1, maxCostUsd: 2 })

        expect(state.evaluated).toEqual(['a', 'b'])
        expect(outcome.spentUsd).toBe(2)
        expect(outcome.uncosted).toEqual(['a'])
    })

    it('drops the stopped run as soon as a fresh run starts, even if it is interrupted', async () => {
        await evalRun.run({ concurrency: 1, maxCostUsd: 2 })
        state.evaluated = []

        await evalRun.run({ concurrency: 1, fresh: true, maxCostUsd: 0 })
        await evalRun.run({ concurrency: 1 })

        expect(state.evaluated).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })

    it('keeps saved results outside a subset run for the next full run', async () => {
        await evalRun.run({ concurrency: 1, maxCostUsd: 2 })
        state.evaluated = []

        const subset = await evalRun.run({ concurrency: 1, only: ['c'] })

        expect(subset.remaining).toBe(0)
        expect(state.partial?.entries.map((entry) => entry.comparison.id)).toEqual(['a', 'b'])

        await evalRun.run({ concurrency: 1 })

        expect(state.evaluated).toEqual(['c', 'c', 'd', 'e', 'f'])
        expect(state.partial).toBeNull()
    })
})

function fixture(id: string): ChatEvalFixture {
    return { id, kind: 'regression', description: id, initialMessages: [], userTurns: [], recordedToolCalls: [], model: { provider: AIProviderName.OPENROUTER, modelId: 'model', tier: { id: 'tier', thinkingBudget: 0, modelId: 'model' } }, assertions: [], judge: [] }
}

function entry({ id, costUsd, crashedRepeat }: { id: string, costUsd: number, crashedRepeat: boolean }): EvalReportEntry {
    return { id, kind: 'regression', description: id, provider: 'openrouter', modelId: 'model', judgeModelId: 'judge', runs: 1, passes: 1, passed: true, assertions: [], judge: [], transcript: '', costUsd: crashedRepeat ? null : costUsd, knownCostUsd: costUsd, judgeCostUsd: 0, runVerdicts: [] }
}

type TestState = {
    fixtures: ChatEvalFixture[]
    partial: PartialRun | null
    lastRunWrites: number
    inFlight: number
    maxInFlight: number
    evaluated: string[]
    systemPrompt: string
    costPerFixture: number
    crashedRepeatIds: string[]
}
