import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ChatEvalFixture } from './fixture'
import { llmJudge } from './llm-judge'
import { chatEvalRunner } from './runner'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const HAS_PROVIDER_KEY = Boolean(process.env['ANTHROPIC_API_KEY'] || process.env['OPENAI_API_KEY'] || process.env['OPENROUTER_API_KEY'])

function loadFixtures(): ChatEvalFixture[] {
    return readdirSync(FIXTURES_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) => JSON.parse(readFileSync(path.join(FIXTURES_DIR, file), 'utf-8')) as ChatEvalFixture)
}

async function evaluateFixture(fixture: ChatEvalFixture): Promise<FixtureEvaluation> {
    const auth = chatEvalRunner.resolveAuth(fixture.model.provider)
    if (!auth) {
        return { id: fixture.id, passed: false, failedAssertions: [], divergences: [], failedJudge: [], judgeVerdicts: [], skippedNoKey: true }
    }

    const { assertionResults, divergences, transcript, passedAssertions } = await chatEvalRunner.runFixture({ fixture })
    const judge = llmJudge.create({ provider: fixture.model.provider, modelId: fixture.model.modelId, auth })
    const judgeVerdicts = await Promise.all(
        fixture.judge.map(async (dimension) => ({ ...dimension, ...await judge.judge({ dimension: dimension.dimension, rubric: dimension.rubric, transcript }) })),
    )

    const failedJudge = judgeVerdicts.filter((verdict) => !verdict.pass)
    return {
        id: fixture.id,
        passed: passedAssertions && failedJudge.length === 0,
        failedAssertions: assertionResults.filter((r) => !r.pass),
        divergences,
        failedJudge,
        judgeVerdicts,
        skippedNoKey: false,
    }
}

describe.skipIf(!HAS_PROVIDER_KEY)('chat-eval regression gate (live — requires a provider API key)', () => {
    const regressionFixtures = loadFixtures().filter((fixture) => fixture.kind === 'regression')

    it('every regression fixture passes its assertions and LLM-judge dimensions', async () => {
        const evaluations = await Promise.all(regressionFixtures.map(evaluateFixture))
        const failures = evaluations.filter((evaluation) => !evaluation.passed)
        expect(failures, JSON.stringify(failures, null, 2)).toEqual([])
    }, 180_000)

    it('LLM-judge stays calibrated to human labels (TPR/TNR >= 0.9)', async () => {
        const evaluations = await Promise.all(loadFixtures().map(evaluateFixture))
        const labeled = evaluations.flatMap((evaluation) => evaluation.judgeVerdicts)
        const positives = labeled.filter((v) => v.expectedLabel === 'pass')
        const negatives = labeled.filter((v) => v.expectedLabel === 'fail')

        const tpr = positives.length === 0 ? 1 : positives.filter((v) => v.pass).length / positives.length
        const tnr = negatives.length === 0 ? 1 : negatives.filter((v) => !v.pass).length / negatives.length

        expect(tpr, `judge true-positive rate ${tpr}`).toBeGreaterThanOrEqual(0.9)
        expect(tnr, `judge true-negative rate ${tnr}`).toBeGreaterThanOrEqual(0.9)
    }, 180_000)
})

type FixtureEvaluation = {
    id: string
    passed: boolean
    failedAssertions: unknown[]
    divergences: unknown[]
    failedJudge: unknown[]
    judgeVerdicts: Array<{ expectedLabel: 'pass' | 'fail', pass: boolean }>
    skippedNoKey: boolean
}
