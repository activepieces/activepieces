import { ChatEvalFixture } from '../core/fixture'
import { evalFixtures } from '../core/fixtures-loader'
import { evalPrompts } from '../core/prompts'
import { agentEvalRunner } from '../core/runner'
import { evalStore, FixtureComparison, RunResult } from './store'

function deltaOf({ baselinePassed, candidatePassed }: { baselinePassed: boolean, candidatePassed: boolean }): FixtureComparison['delta'] {
    if (candidatePassed && !baselinePassed) {
        return 'improved'
    }
    if (!candidatePassed && baselinePassed) {
        return 'regressed'
    }
    return 'same'
}

async function run({ candidatePath, baselineModelId, candidateModelId, only, limit, onProgress }: { candidatePath?: string, baselineModelId?: string, candidateModelId?: string, only?: string[], limit?: number, onProgress?: (message: string) => void }): Promise<RunResult> {
    const fixtures = selectFixtures({ fixtures: evalFixtures.load(), only, limit })
    const sources = evalPrompts.resolveSources({ candidatePath })
    const first = fixtures[0]
    const comparisons: FixtureComparison[] = []

    try {
        for (const fixture of fixtures) {
            const baselineModel = baselineModelId ?? fixture.model.modelId
            const candidateModel = candidateModelId ?? fixture.model.modelId
            onProgress?.(`evaluating ${fixture.id} · ${sources.baseline.label} · ${baselineModel}`)
            const baseline = await agentEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.baseline.systemPrompt, guides: sources.baseline.guides, modelId: baselineModel })
            let candidate = baseline
            if (sources.changed || baselineModel !== candidateModel) {
                onProgress?.(`evaluating ${fixture.id} · ${sources.candidate.label} · ${candidateModel}`)
                candidate = await agentEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.candidate.systemPrompt, guides: sources.candidate.guides, modelId: candidateModel })
            }
            comparisons.push({ id: fixture.id, baseline, candidate, delta: deltaOf({ baselinePassed: baseline.passed, candidatePassed: candidate.passed }) })
        }
    }
    finally {
        await agentEvalRunner.cleanupAuth()
    }

    return evalStore.writeRun({
        at: new Date().toISOString(),
        provider: first?.model.provider ?? 'openrouter',
        baselineModelId: baselineModelId ?? first?.model.modelId ?? '',
        candidateModelId: candidateModelId ?? first?.model.modelId ?? '',
        baselineLabel: sources.baseline.label,
        candidateLabel: sources.candidate.label,
        promptChanged: sources.changed,
        comparisons,
    })
}

function selectFixtures({ fixtures, only, limit }: { fixtures: ChatEvalFixture[], only?: string[], limit?: number }): ChatEvalFixture[] {
    const unknown = (only ?? []).filter((id) => !fixtures.some((fixture) => fixture.id === id))
    if (unknown.length > 0) {
        throw new Error(`Unknown fixture id(s): ${unknown.join(', ')}`)
    }
    const picked = only === undefined ? fixtures : fixtures.filter((fixture) => only.includes(fixture.id))
    return limit === undefined ? picked : picked.slice(0, limit)
}

export const evalRun = {
    run,
}
