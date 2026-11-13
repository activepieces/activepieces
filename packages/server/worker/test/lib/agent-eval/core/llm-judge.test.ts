import { AIProviderName } from '@activepieces/core-utils'
import { afterEach, describe, expect, it, MockInstance, vi } from 'vitest'
import { llmJudge } from './llm-judge'

describe('llmJudge.create with a Jev model', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('asks the decisions endpoint about the rubric with the caller key', async () => {
        const fetchSpy = respondWith({ body: { answers: { pass: { noul: 0.9 } }, usage: { cost: 0.01 } } })

        await jevJudge().judge(QUESTION)

        const [url, init] = fetchSpy.mock.calls[0]
        expect(url).toBe('https://openrouter.ai/api/alpha/decisions')
        expect(init?.method).toBe('POST')
        expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-key')
        const sent = JSON.parse(String(init?.body))
        expect(sent.model).toBe(JEV_MODEL)
        expect(sent.state.text).toBe(QUESTION.transcript)
        expect(sent.questions.pass.instructions).toContain(QUESTION.rubric)
        expect(sent.questions.pass.instructions).toContain(QUESTION.dimension)
    })

    it('passes a likely answer and leaves the failure type out', async () => {
        respondWith({ body: { answers: { pass: { noul: 0.8 }, failure: { choice: 'gave_up' } } } })

        const verdict = await jevJudge().judge(QUESTION)

        expect(verdict).toEqual({ pass: true, reason: 'Jev P(pass) = 0.80' })
    })

    it('fails an unlikely answer with the failure type it chose', async () => {
        respondWith({ body: { answers: { pass: { noul: 0.2 }, failure: { choice: 'hallucinated' } } } })

        const verdict = await jevJudge().judge(QUESTION)

        expect(verdict).toEqual({ pass: false, reason: 'Jev P(pass) = 0.20', failure: 'hallucinated' })
    })

    it('fails without a failure type when the choice is not a known one', async () => {
        respondWith({ body: { answers: { pass: { noul: 0.2 }, failure: { choice: 'made_up_kind' } } } })

        const verdict = await jevJudge().judge(QUESTION)

        expect(verdict).toEqual({ pass: false, reason: 'Jev P(pass) = 0.20' })
    })

    it('throws when the response has no answer', async () => {
        respondWith({ body: { answers: {} } })

        await expect(jevJudge().judge(QUESTION)).rejects.toThrow('[Jev judge] the response had no answer')
    })

    it('throws with the status on an HTTP error', async () => {
        respondWith({ body: 'rate limited', status: 429 })

        await expect(jevJudge().judge(QUESTION)).rejects.toThrow('[Jev judge] HTTP 429: rate limited')
    })

    it('sums the reported cost across calls', async () => {
        respondWith({ body: { answers: { pass: { noul: 0.9 } }, usage: { cost: 0.25 } } })
        const judge = jevJudge()

        await judge.judge(QUESTION)
        await judge.judge(QUESTION)

        expect(judge.costUsd()).toBe(0.5)
    })

    it('reports an unknown cost when a call reports none', async () => {
        respondWith({ body: { answers: { pass: { noul: 0.9 } } } })
        const judge = jevJudge()

        await judge.judge(QUESTION)

        expect(judge.costUsd()).toBeNull()
    })
})

function jevJudge(): ReturnType<typeof llmJudge.create> {
    return llmJudge.create({ provider: AIProviderName.OPENROUTER, modelId: JEV_MODEL, auth: { apiKey: 'test-key' } })
}

function respondWith({ body, status = 200 }: { body: unknown, status?: number }): MockInstance<typeof fetch> {
    const text = typeof body === 'string' ? body : JSON.stringify(body)
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(text, { status }))
}

const JEV_MODEL = 'typesafe/jev-1'

const QUESTION = { dimension: 'plain language', rubric: 'Uses no jargon', transcript: 'user: hi\nassistant: hello' }
