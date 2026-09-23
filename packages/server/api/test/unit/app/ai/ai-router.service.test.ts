import { ActivepiecesError, AIProviderName, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { AiRouterMatchMode, AiStepAction } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { enqueue, waitForAnswer, listForProject, assertCredits } = vi.hoisted(() => ({
    enqueue: vi.fn(),
    waitForAnswer: vi.fn(),
    listForProject: vi.fn(),
    assertCredits: vi.fn(),
}))

vi.mock('../../../../src/app/ai/ai-execution', () => ({
    aiExecution: () => ({ serverId: () => 'server-1', enqueue, waitForAnswer }),
}))

vi.mock('../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({ listForProject }),
}))

vi.mock('../../../../src/app/platform/billing-provider', () => ({
    assertCreditsAndAppSumoNotExceeded: assertCredits,
}))

const { aiRouterService } = await import('../../../../src/app/ai/ai-router.service')

const log = { info: vi.fn(), warn: vi.fn() }
const service = () => aiRouterService(log as never)

const REQUEST = {
    platformId: 'platform-1',
    projectId: 'project-1',
    flowId: 'flow-1',
    flowRunId: 'run-1',
    state: 'charged twice',
    question: 'Which team?',
    options: { Billing: 'Payments', Technical: 'Bugs' },
    matchMode: AiRouterMatchMode.BEST_MATCH,
}

const OUT_OF_CREDITS = new ActivepiecesError({ code: ErrorCode.QUOTA_EXCEEDED, params: { metric: PlatformUsageMetric.CREDITS } })

function provider(name: AIProviderName) {
    return { provider: name, name, enabledForChat: false, keys: [] }
}

beforeEach(() => {
    vi.clearAllMocks()
    listForProject.mockResolvedValue([provider(AIProviderName.OPENROUTER), provider(AIProviderName.ACTIVEPIECES)])
    assertCredits.mockResolvedValue(undefined)
    enqueue.mockResolvedValue(undefined)
    waitForAnswer.mockResolvedValue({ output: { matched: ['Billing'], probabilities: { Billing: 0.9, Technical: 0.1 } } })
})

describe('aiRouterService runs the decision as a worker AI job', () => {
    it('enqueues a route job on the managed provider and returns the worker\'s answer', async () => {
        const answer = await service().choose(REQUEST)

        expect(enqueue).toHaveBeenCalledTimes(1)
        expect(enqueue.mock.calls[0][0]).toMatchObject({
            action: AiStepAction.ROUTE,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'typesafe/jev-1.13',
            webserverId: 'server-1',
            platformId: 'platform-1',
            projectId: 'project-1',
            flowId: 'flow-1',
            flowRunId: 'run-1',
            state: 'charged twice',
            question: 'Which team?',
            options: { Billing: 'Payments', Technical: 'Bugs' },
            matchMode: AiRouterMatchMode.BEST_MATCH,
        })
        expect(waitForAnswer.mock.calls[0][0].requestId).toBe(enqueue.mock.calls[0][0].requestId)
        expect(answer).toEqual({ matched: ['Billing'], probabilities: { Billing: 0.9, Technical: 0.1 } })
    })

    it('starts listening for the answer before the job is enqueued, so a fast worker cannot answer into the void', async () => {
        await service().choose(REQUEST)

        expect(waitForAnswer.mock.invocationCallOrder[0]).toBeLessThan(enqueue.mock.invocationCallOrder[0])
    })

    it('falls back to the platform\'s own OpenRouter key when the managed provider is absent', async () => {
        listForProject.mockResolvedValue([provider(AIProviderName.OPENROUTER), provider(AIProviderName.OPENAI)])

        await service().choose(REQUEST)

        expect(enqueue.mock.calls[0][0]).toMatchObject({ provider: AIProviderName.OPENROUTER })
    })

    it('refuses with a setup message when no OpenRouter-capable key exists, and enqueues nothing', async () => {
        listForProject.mockResolvedValue([provider(AIProviderName.OPENAI)])

        await expect(service().choose(REQUEST)).rejects.toMatchObject({ error: { code: ErrorCode.FEATURE_DISABLED, params: { message: expect.stringContaining('OpenRouter') } } })
        expect(enqueue).not.toHaveBeenCalled()
    })

    it('refuses with a credits message when the platform is definitely out of credits', async () => {
        assertCredits.mockRejectedValue(OUT_OF_CREDITS)

        await expect(service().choose(REQUEST)).rejects.toMatchObject({ error: { code: ErrorCode.QUOTA_EXCEEDED, params: { message: expect.stringContaining('out of AI credits') } } })
        expect(enqueue).not.toHaveBeenCalled()
    })

    it('lets the call through when the credits lookup itself fails', async () => {
        assertCredits.mockRejectedValue(new Error('autumn is down'))

        await service().choose(REQUEST)

        expect(enqueue).toHaveBeenCalledTimes(1)
        expect(log.warn).toHaveBeenCalled()
    })

    it('turns the worker\'s failure text into the error the engine shows', async () => {
        waitForAnswer.mockResolvedValue({ failure: 'The routing model did not answer: HTTP 402: Insufficient credits' })

        await expect(service().choose(REQUEST)).rejects.toMatchObject({ error: { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: 'The routing model did not answer: HTTP 402: Insufficient credits' } } })
    })

    it('fails when the worker answered in a shape the engine cannot read', async () => {
        waitForAnswer.mockResolvedValue({ output: { chosen: 'Billing' } })

        await expect(service().choose(REQUEST)).rejects.toMatchObject({ error: { code: ErrorCode.ENGINE_OPERATION_FAILURE } })
    })
})
