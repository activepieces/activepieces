import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, AIProviderName } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { activepiecesAiCost } from '../src/activepieces-ai-cost'
import { aiCostReporter } from '../src/ai-cost-reporter'

vi.mock('node:timers/promises', () => ({
    setTimeout: async () => undefined,
}))

const BILLING: ActivepiecesAiBilling = {
    source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
    platformId: 'platform-1',
    projectId: 'project-1',
    flowRun: { flowId: 'flow-1', flowRunId: 'run-1' },
}

async function reportOnceThrough(report: (request: ReportAiUsageRequest) => Promise<void>): Promise<void> {
    const logged = vi.fn()
    aiCostReporter.install({ log: { error: logged }, report, pageWebhookUrl: () => undefined })
    activepiecesAiCost.reportFixedCredits({ billing: BILLING, provider: AIProviderName.OPENAI, modelId: 'gpt-5' })
    await vi.waitFor(() => expect(report.mock.calls.length).toBeGreaterThan(0))
    await new Promise((resolve) => setImmediate(resolve))
}

describe('aiCostReporter retries', () => {
    it('retries a failed report with the same idempotency key until it lands', async () => {
        const report = vi.fn<(request: ReportAiUsageRequest) => Promise<void>>()
            .mockRejectedValueOnce(new Error('socket closed'))
            .mockRejectedValueOnce(new Error('socket closed'))
            .mockResolvedValue(undefined)
        await reportOnceThrough(report)
        await vi.waitFor(() => expect(report).toHaveBeenCalledTimes(3))
        const keys = report.mock.calls.map(([request]) => request.idempotencyKey)
        expect(new Set(keys).size).toBe(1)
    })

    it('stops after the first success', async () => {
        const report = vi.fn<(request: ReportAiUsageRequest) => Promise<void>>().mockResolvedValue(undefined)
        await reportOnceThrough(report)
        expect(report).toHaveBeenCalledTimes(1)
    })

    it('gives up after three retries', async () => {
        const report = vi.fn<(request: ReportAiUsageRequest) => Promise<void>>().mockRejectedValue(new Error('api down'))
        await reportOnceThrough(report)
        await vi.waitFor(() => expect(report).toHaveBeenCalledTimes(4))
    })
})
