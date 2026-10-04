import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { evalFixtures } from './core/fixtures-loader'
import { agentEvalReport, EvalReportEntry } from './core/report'
import { agentEvalRunner } from './core/runner'

const HAS_PROVIDER_KEY = agentEvalRunner.hasProviderKey()
const REPEATS = agentEvalRunner.repeatsFromEnv()
const RESULTS_PATH = process.env.CHAT_EVAL_RESULTS_PATH

describe.skipIf(!HAS_PROVIDER_KEY)('agent-eval regression gate (live — requires a provider API key)', () => {
    let evaluations: EvalReportEntry[] = []

    // CHAT_EVAL_SCOPE=regression (the CI nightly default) runs only the gating fixtures — cheap and
    // stable. 'all' (local default + on-demand dispatch) runs the full suite incl. capability targets.
    beforeAll(async () => {
        const scope = process.env.CHAT_EVAL_SCOPE ?? 'all'
        const fixtures = evalFixtures.load().filter((fixture) => scope === 'all' || fixture.kind === 'regression')
        evaluations = await Promise.all(fixtures.map((fixture) => agentEvalRunner.evaluateFixture({ fixture, repeats: REPEATS })))
    }, 180_000 * REPEATS)

    afterAll(async () => {
        await agentEvalRunner.cleanupAuth()
        if (evaluations.length > 0) {
            process.stdout.write(agentEvalReport.render({ entries: evaluations }))
        }
        if (RESULTS_PATH && evaluations.length > 0) {
            mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
            writeFileSync(RESULTS_PATH, JSON.stringify({
                runAt: new Date().toISOString(),
                commit: process.env.GITHUB_SHA ?? null,
                judgeModelId: evaluations[0].judgeModelId,
                repeats: REPEATS,
                entries: evaluations,
            }, null, 2))
        }
    })

    // The gate hard-fails ONLY on regression fixtures — the behaviors the prompt must not break.
    // Capability fixtures are aspirational hill-climbing targets; the model legitimately misses some,
    // so gating on them (or on a whole-suite TPR that counts those misses as judge errors) would keep
    // the gate perpetually red. The full-suite pass rate + calibration TPR/TNR are printed in the
    // afterAll report as a progress signal, not gated here.
    it('every regression fixture passes its assertions and LLM-judge dimensions', () => {
        const failed = evaluations.filter((evaluation) => evaluation.kind === 'regression' && !evaluation.passed)
        expect(failed.map((evaluation) => evaluation.id), 'see the eval report above for the failing checks').toEqual([])
    })
})
