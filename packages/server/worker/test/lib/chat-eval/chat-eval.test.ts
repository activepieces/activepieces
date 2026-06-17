import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { evalFixtures } from './core/fixtures-loader'
import { evalFormat } from './core/eval-format'
import { chatEvalReport, EvalReportEntry } from './core/report'
import { chatEvalRunner } from './core/runner'

const HAS_PROVIDER_KEY = chatEvalRunner.hasProviderKey()

describe.skipIf(!HAS_PROVIDER_KEY)('chat-eval regression gate (live — requires a provider API key)', () => {
    let evaluations: EvalReportEntry[] = []

    beforeAll(async () => {
        evaluations = await Promise.all(evalFixtures.load().map((fixture) => chatEvalRunner.evaluateFixture({ fixture })))
    }, 180_000)

    afterAll(async () => {
        await chatEvalRunner.cleanupAuth()
        if (evaluations.length > 0) {
            process.stdout.write(chatEvalReport.render({ entries: evaluations }))
        }
    })

    it('every regression fixture passes its assertions and LLM-judge dimensions', () => {
        const failed = evaluations.filter((evaluation) => evaluation.kind === 'regression' && !evaluation.passed)
        expect(failed.map((evaluation) => evaluation.id), 'see the eval report above for the failing checks').toEqual([])
    })

    it('LLM-judge stays calibrated to human labels (TPR/TNR >= 0.9)', () => {
        const { tpr, tnr } = evalFormat.calibration(evaluations)
        expect(tpr, `judge true-positive rate ${tpr}`).toBeGreaterThanOrEqual(0.9)
        expect(tnr, `judge true-negative rate ${tnr}`).toBeGreaterThanOrEqual(0.9)
    })
})
