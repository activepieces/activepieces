import { AiRouterMatchMode } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { post: (...args: unknown[]) => post(...args) } },
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { get: () => 'a-key' },
}))

const { aiRouterService } = await import('../../../../src/app/ai/ai-router.service')

const log = { info: vi.fn(), warn: vi.fn() }
const service = () => aiRouterService(log as never)

beforeEach(() => {
    post.mockReset()
})

function sentBody() {
    return post.mock.calls[0][1]
}

describe('aiRouterService in best-match mode', () => {
    it('asks one choice question carrying every route as a criterion', async () => {
        post.mockResolvedValue({ data: { answers: { route: { choice: 'Billing', probabilities: { Billing: 0.91, Technical: 0.09 } } } } })

        const answer = await service().choose({
            state: 'charged twice',
            question: 'Which team?',
            options: { Billing: 'Payments', Technical: 'Bugs' },
            matchMode: AiRouterMatchMode.BEST_MATCH,
        })

        expect(sentBody().questions).toEqual({
            route: { type: 'choice', instructions: 'Which team?', criteria: { Billing: 'Payments', Technical: 'Bugs' } },
        })
        expect(answer).toEqual({ matched: ['Billing'], probabilities: { Billing: 0.91, Technical: 0.09 } })
    })

    it('fails when the model returned no choice', async () => {
        post.mockResolvedValue({ data: { answers: {} } })

        await expect(service().choose({
            state: 'x', question: 'q', options: { Billing: 'Payments' }, matchMode: AiRouterMatchMode.BEST_MATCH,
        })).rejects.toMatchObject({ error: { code: 'ENGINE_OPERATION_FAILURE' } })
    })
})

describe('aiRouterService in all-matches mode', () => {
    it('asks one boolean question per route in a single request', async () => {
        post.mockResolvedValue({ data: { answers: { r0: { probability: 0.9 }, r1: { probability: 0.2 } } } })

        const answer = await service().choose({
            state: 'charged twice',
            question: 'Which team?',
            options: { Billing: 'Payments', Technical: 'Bugs' },
            matchMode: AiRouterMatchMode.ALL_MATCHES,
        })

        expect(post).toHaveBeenCalledTimes(1)
        expect(Object.keys(sentBody().questions)).toEqual(['r0', 'r1'])
        expect(sentBody().questions.r0.type).toBe('boolean')
        expect(sentBody().questions.r0.instructions).toContain('Which team?')
        expect(sentBody().questions.r0.instructions).toContain('Billing — Payments')
        expect(answer.matched).toEqual(['Billing'])
    })

    it('reports the probability that the route applies and does not match below one half', async () => {
        post.mockResolvedValue({ data: { answers: { r0: { probability: 0.2 } } } })

        const answer = await service().choose({
            state: 'x', question: 'q', options: { Billing: 'Payments' }, matchMode: AiRouterMatchMode.ALL_MATCHES,
        })

        expect(answer.matched).toEqual([])
        expect(answer.probabilities?.Billing).toBeCloseTo(0.2, 6)
    })

    it('returns no matches when the model said no to everything', async () => {
        post.mockResolvedValue({ data: { answers: { r0: { probability: 0.1 }, r1: { probability: 0.3 } } } })

        const answer = await service().choose({
            state: 'x', question: 'q', options: { Billing: 'Payments', Sales: 'Pricing' }, matchMode: AiRouterMatchMode.ALL_MATCHES,
        })

        expect(answer.matched).toEqual([])
    })

    it('fails when no boolean answer carries a probability', async () => {
        post.mockResolvedValue({ data: { answers: { r0: { answer: true } } } })

        await expect(service().choose({
            state: 'x', question: 'q', options: { Billing: 'Payments' }, matchMode: AiRouterMatchMode.ALL_MATCHES,
        })).rejects.toMatchObject({ error: { code: 'ENGINE_OPERATION_FAILURE' } })
    })
})

describe('aiRouterService failures', () => {
    it('never lets the gateway error escape, because it carries the key', async () => {
        post.mockRejectedValue(Object.assign(new Error('Request failed with status code 401'), {
            config: { headers: { Authorization: 'Bearer a-key' } },
        }))

        const attempt = service().choose({
            state: 'x', question: 'q', options: { Billing: 'Payments' }, matchMode: AiRouterMatchMode.BEST_MATCH,
        })

        await expect(attempt).rejects.toMatchObject({ error: { code: 'ENGINE_OPERATION_FAILURE' } })
        await expect(attempt).rejects.not.toMatchObject({ config: expect.anything() })
    })
})
