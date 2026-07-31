import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { evalFixtures } from './core/fixtures-loader'
import { chatEvalReport, EvalReportEntry } from './core/report'
import { chatEvalRunner } from './core/runner'

const HAS_PROVIDER_KEY = chatEvalRunner.hasProviderKey()

describe.skipIf(!HAS_PROVIDER_KEY)('chat-eval regression gate (live — requires a provider API key)', () => {
    let evaluations: EvalReportEntry[] = []

    // CHAT_EVAL_SCOPE=regression (the CI nightly default) runs only the gating fixtures — cheap and
    // stable. 'all' (local default + on-demand dispatch) runs the full suite incl. capability targets.
    beforeAll(async () => {
        const scope = process.env.CHAT_EVAL_SCOPE ?? 'all'
        const fixtures = evalFixtures.load().filter((fixture) => scope === 'all' || fixture.kind === 'regression')
        evaluations = await Promise.all(fixtures.map((fixture) => chatEvalRunner.evaluateFixture({ fixture })))
    }, 180_000)

    afterAll(async () => {
        await chatEvalRunner.cleanupAuth()
        if (evaluations.length > 0) {
            process.stdout.write(chatEvalReport.render({ entries: evaluations }))
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
