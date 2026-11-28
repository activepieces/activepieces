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
// Repeats run one after another. Worst case per repeat is a 5-min agent turn plus a 2-min judge call.
// 4 min per repeat covers normal runs; past that the fixture fails with the stage it was stuck in.
const FIXTURE_DEADLINE_MS = 4 * 60_000 * REPEATS
const HOOK_MARGIN_MS = 60_000

function withDeadline<T>({ promise, onTimeout }: { promise: Promise<T>, onTimeout: () => Error }): Promise<T> {
    let timer: NodeJS.Timeout | undefined
    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), FIXTURE_DEADLINE_MS)
    })
    return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

describe.skipIf(!HAS_PROVIDER_KEY)('agent-eval regression gate (live — requires a provider API key)', () => {
    let evaluations: EvalReportEntry[] = []
    let judgeAgreement: JudgeAgreement | null = null

    // CHAT_EVAL_SCOPE=regression (the CI nightly default) runs only the gating fixtures — cheap and
    // stable. 'all' (local default + on-demand dispatch) runs the full suite incl. capability targets.
    beforeAll(async () => {
        const fixtures = evalFixtures.load().filter((fixture) => SCOPE === 'all' || fixture.kind === 'regression')
        const [fixtureResults, agreement] = await Promise.all([
            Promise.all(fixtures.map((fixture) => {
                let lastStage = 'starting'
                const evaluation = agentEvalRunner.evaluateFixture({ fixture, repeats: REPEATS, onStage: (stage) => {
                    lastStage = stage
                } })
                return withDeadline({
                    promise: evaluation,
                    onTimeout: () => new Error(`Fixture did not finish within ${FIXTURE_DEADLINE_MS / 1000}s (last stage: ${lastStage})`),
                }).catch((error: unknown) => agentEvalRunner.failedEntry({ fixture, error }))
            })),
            withDeadline({
                promise: agentEvalRunner.measureJudgeAgreement(),
                onTimeout: () => new Error('Judge agreement did not finish in time'),
            }).catch(() => null),
        ])
        evaluations = fixtureResults
        judgeAgreement = agreement
    // Each fixture gets its own deadline so a slow or stuck one is reported as a failed fixture with
    // the stage it was in, instead of the whole hook timing out with no report at all.
    }, FIXTURE_DEADLINE_MS + HOOK_MARGIN_MS)

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
