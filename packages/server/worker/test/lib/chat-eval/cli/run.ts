import { evalFixtures } from '../core/fixtures-loader'
import { evalPrompts } from '../core/prompts'
import { chatEvalRunner } from '../core/runner'
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

async function run({ candidatePath, onProgress }: { candidatePath?: string, onProgress?: (message: string) => void }): Promise<RunResult> {
    const fixtures = evalFixtures.load()
    const sources = evalPrompts.resolveSources({ candidatePath })
    const comparisons: FixtureComparison[] = []

    try {
        for (const fixture of fixtures) {
            onProgress?.(`evaluating ${fixture.id} · ${sources.baseline.label}`)
            const baseline = await chatEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.baseline.systemPrompt, guides: sources.baseline.guides })
            let candidate = baseline
            if (sources.changed) {
                onProgress?.(`evaluating ${fixture.id} · ${sources.candidate.label}`)
                candidate = await chatEvalRunner.evaluateFixture({ fixture, systemPrompt: sources.candidate.systemPrompt, guides: sources.candidate.guides })
            }
            comparisons.push({ id: fixture.id, baseline, candidate, delta: deltaOf({ baselinePassed: baseline.passed, candidatePassed: candidate.passed }) })
        }
    }
    finally {
        await chatEvalRunner.cleanupAuth()
    }

    const first = fixtures[0]
    const result: RunResult = {
        at: new Date().toISOString(),
        provider: first?.model.provider ?? 'openrouter',
        modelId: first?.model.modelId ?? '',
        baselineLabel: sources.baseline.label,
        candidateLabel: sources.candidate.label,
        changed: sources.changed,
        comparisons,
    }
    evalStore.writeRun(result)
    return result
}

export const evalRun = {
    run,
}
