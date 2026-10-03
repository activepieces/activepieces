import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { evalFixtures } from './core/fixtures-loader'
import { JudgeAgreement } from './core/eval-format'
import { agentEvalReport, EvalReportEntry } from './core/report'
import { agentEvalRunner } from './core/runner'

const HAS_PROVIDER_KEY = agentEvalRunner.hasProviderKey()
const REPEATS = agentEvalRunner.repeatsFromEnv()
const RESULTS_PATH = process.env.CHAT_EVAL_RESULTS_PATH
const SCOPE = process.env.CHAT_EVAL_SCOPE ?? 'all'

describe.skipIf(!HAS_PROVIDER_KEY)('agent-eval regression gate (live — requires a provider API key)', () => {
    let evaluations: EvalReportEntry[] = []
    let judgeAgreement: JudgeAgreement | null = null

    // CHAT_EVAL_SCOPE=regression (the CI nightly default) runs only the gating fixtures — cheap and
    // stable. 'all' (local default + on-demand dispatch) runs the full suite incl. capability targets.
    beforeAll(async () => {
        const fixtures = evalFixtures.load().filter((fixture) => SCOPE === 'all' || fixture.kind === 'regression')
        const [fixtureResults, agreement] = await Promise.all([
            Promise.all(fixtures.map((fixture) => agentEvalRunner.evaluateFixture({ fixture, repeats: REPEATS }))),
            agentEvalRunner.measureJudgeAgreement(),
        ])
        evaluations = fixtureResults
        judgeAgreement = agreement
    }, 180_000 * REPEATS)

    afterAll(async () => {
        await agentEvalRunner.cleanupAuth()
        if (evaluations.length > 0) {
            process.stdout.write(agentEvalReport.render({ entries: evaluations, judgeAgreement }))
        }
        if (RESULTS_PATH && evaluations.length > 0) {
            mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
            writeFileSync(RESULTS_PATH, JSON.stringify({
                runAt: new Date().toISOString(),
                commit: process.env.GITHUB_SHA ?? null,
                ref: process.env.GITHUB_REF_NAME ?? null,
                scope: SCOPE,
                judgeModelId: evaluations[0].judgeModelId,
                repeats: REPEATS,
                judgeAgreement,
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
