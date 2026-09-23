import { AIProviderName } from '@activepieces/core-utils'
import { AiRouterMatchMode, AiStepAction, ResolveAiProviderResponse, RouteJobData } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post, reportFixedCredits, reportProviderCost } = vi.hoisted(() => ({
    post: vi.fn(),
    reportFixedCredits: vi.fn(),
    reportProviderCost: vi.fn(),
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    safeHttp: { axios: { post: (...args: unknown[]) => post(...args) } },
    activepiecesAiCost: { reportFixedCredits, reportProviderCost },
}))

const { routeStep } = await import('../../../../../src/lib/execute/jobs/ai/route')
const { executeAiJob } = await import('../../../../../src/lib/execute/jobs/ai/execute-ai')

const BILLING = {
    source: 'ai-step-in-flow' as const,
    platformId: 'platform-1',
    projectId: 'project-1',
    flowRun: { flowId: 'flow-1', flowRunId: 'run-1' },
}

const MANAGED: ResolveAiProviderResponse = {
    provider: AIProviderName.ACTIVEPIECES,
    providerConfigId: 'config-1',
    auth: { apiKey: 'managed-key', apiKeyHash: 'hash' },
    config: {},
}

const OWN_KEY: ResolveAiProviderResponse = {
    provider: AIProviderName.OPENROUTER,
    providerConfigId: 'config-2',
    auth: { apiKey: 'own-key' },
    config: {},
}

function routeJob(overrides: Partial<RouteJobData> = {}): RouteJobData {
    return {
        schemaVersion: 1,
        jobType: 'EXECUTE_AI',
        action: AiStepAction.ROUTE,
        requestId: 'request-1',
        projectId: 'project-1',
        platformId: 'platform-1',
        flowId: 'flow-1',
        flowRunId: 'run-1',
        provider: AIProviderName.ACTIVEPIECES,
        modelId: 'typesafe/jev-1.13',
        state: 'my card was charged twice',
        question: 'Which team should handle this?',
        options: { Billing: 'Payments, invoices, refunds', Sales: 'Pricing questions' },
        matchMode: AiRouterMatchMode.BEST_MATCH,
        ...overrides,
    }
}

function sentBody(): Record<string, unknown> {
    return post.mock.calls[0][1]
}

function sentConfig(): { headers: Record<string, string> } {
    return post.mock.calls[0][2]
}

describe('routeStep asks OpenRouter\'s decisions endpoint', () => {
    beforeEach(() => {
        post.mockReset()
        reportFixedCredits.mockReset()
        reportProviderCost.mockReset()
    })

    it('sends one choice question carrying every route as a criterion, on the resolved key', async () => {
        post.mockResolvedValue({ data: { id: 'gen-1', answers: { route: { type: 'choice', choice: 'Billing', probabilities: { Billing: 0.91, Sales: 0.09 } } } } })

        const answer = await routeStep({ data: routeJob(), resolved: MANAGED, billing: BILLING })

        expect(post.mock.calls[0][0]).toBe('https://openrouter.ai/api/alpha/decisions')
        expect(sentBody()).toEqual({
            model: 'typesafe/jev-1.13',
            state: { text: 'my card was charged twice' },
            questions: {
                route: { type: 'choice', instructions: 'Which team should handle this?', criteria: { Billing: 'Payments, invoices, refunds', Sales: 'Pricing questions' } },
            },
        })
        expect(sentConfig().headers.Authorization).toBe('Bearer managed-key')
        expect(answer).toEqual({ matched: ['Billing'], probabilities: { Billing: 0.91, Sales: 0.09 } })
    })

    it('asks one noul question per route in every-route mode and reads the probability from the noul field', async () => {
        post.mockResolvedValue({ data: { answers: { r0: { type: 'noul', noul: 0.7 }, r1: { type: 'noul', noul: 0.2 } } } })

        const answer = await routeStep({ data: routeJob({ matchMode: AiRouterMatchMode.ALL_MATCHES }), resolved: MANAGED, billing: BILLING })

        const questions = sentBody().questions as Record<string, { type: string, instructions: string }>
        expect(Object.keys(questions)).toEqual(['r0', 'r1'])
        expect(questions.r0.type).toBe('noul')
        expect(questions.r0.instructions).toContain('Billing — Payments, invoices, refunds')
        expect(answer).toEqual({ matched: ['Billing'], probabilities: { Billing: 0.7, Sales: 0.2 } })
    })

    it('bills the cost OpenRouter reports when the call ran on the managed key', async () => {
        post.mockResolvedValue({ data: { id: 'gen-2', answers: { route: { choice: 'Billing' } }, usage: { input_tokens: 476, output_tokens: 70, cost: 0.00002 } } })

        await routeStep({ data: routeJob(), resolved: MANAGED, billing: BILLING })

        expect(reportProviderCost).toHaveBeenCalledWith({
            billing: BILLING,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'typesafe/jev-1.13',
            costUsd: 0.00002,
            inputTokens: 476,
            outputTokens: 70,
            generationId: 'gen-2',
        })
        expect(reportFixedCredits).not.toHaveBeenCalled()
    })

    it('bills one fixed credit when the call ran on the platform\'s own OpenRouter key', async () => {
        post.mockResolvedValue({ data: { id: 'gen-3', answers: { route: { choice: 'Sales' } }, usage: { cost: 0.00002 } } })

        await routeStep({ data: routeJob({ provider: AIProviderName.OPENROUTER }), resolved: OWN_KEY, billing: BILLING })

        expect(reportFixedCredits).toHaveBeenCalledWith({ billing: BILLING, provider: AIProviderName.OPENROUTER, modelId: 'typesafe/jev-1.13', generationId: 'gen-3' })
        expect(reportProviderCost).not.toHaveBeenCalled()
    })

    it('turns an HTTP failure into a readable message that never carries the key, and bills nothing', async () => {
        post.mockRejectedValue(Object.assign(new Error('Request failed with status code 402'), {
            response: { status: 402, data: { error: { message: 'Insufficient credits' } } },
            config: { headers: { Authorization: 'Bearer managed-key' } },
        }))

        const attempt = routeStep({ data: routeJob(), resolved: MANAGED, billing: BILLING })

        await expect(attempt).rejects.toThrow('HTTP 402: Insufficient credits')
        await expect(attempt).rejects.not.toThrow('Bearer')
        expect(reportProviderCost).not.toHaveBeenCalled()
        expect(reportFixedCredits).not.toHaveBeenCalled()
    })

    it('fails readably when the model answered none of the questions', async () => {
        post.mockResolvedValue({ data: { answers: {} } })

        await expect(routeStep({ data: routeJob(), resolved: MANAGED, billing: BILLING })).rejects.toThrow('did not answer the routing question')
        expect(reportProviderCost).not.toHaveBeenCalled()
    })

    it('refuses to call without a key instead of sending an empty bearer', async () => {
        await expect(routeStep({ data: routeJob(), resolved: { ...OWN_KEY, auth: {} }, billing: BILLING })).rejects.toThrow('no OpenRouter key')
        expect(post).not.toHaveBeenCalled()
    })

    it('hands the raw routing answer back as the step output when run through the AI job', async () => {
        post.mockResolvedValue({ data: { answers: { route: { choice: 'Billing', probabilities: { Billing: 0.8, Sales: 0.2 } } } } })
        const ctx = {
            apiClient: { resolveAiProvider: async () => MANAGED },
            log: { warn: () => undefined, error: () => undefined },
        } as unknown as Parameters<typeof executeAiJob.execute>[0]

        const result = await executeAiJob.execute(ctx, routeJob())

        expect(result).toMatchObject({ response: { output: { matched: ['Billing'], probabilities: { Billing: 0.8, Sales: 0.2 } } } })
    })
})
