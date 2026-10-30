import { AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { DEFAULT_MCP_DATA, RunEnvironment } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const queuedRun = vi.fn<(key: string) => Promise<Record<string, unknown> | null>>()
const savedRun = vi.fn<() => Promise<{ flowId: string, environment: RunEnvironment } | null>>()

vi.mock('../../../../src/app/database/redis-connections', () => ({
    distributedStore: { hgetJson: (key: string) => queuedRun(key) },
}))

vi.mock('../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunRepo: () => ({ findOne: () => savedRun() }),
}))

const { aiCallContext } = await import('../../../../src/app/ai/usage/ai-call-context')

describe('aiCallContext', () => {
    beforeEach(() => {
        queuedRun.mockReset()
        savedRun.mockReset()
    })

    it('treats placeholder run ids as action runs and never looks them up', async () => {
        for (const flowRunId of [DEFAULT_MCP_DATA.flowRunId, 'execute-trigger', 'execute-property']) {
            const context = await aiCallContext.forFlowRun({ flowRunId, projectId: apId() })
            expect(context).toEqual({ origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION })
        }
        expect(queuedRun).not.toHaveBeenCalled()
        expect(savedRun).not.toHaveBeenCalled()
    })

    it('reads a queued production run from its Redis metadata before the database', async () => {
        const flowId = apId()
        queuedRun.mockResolvedValue({ flowId, environment: RunEnvironment.PRODUCTION })
        const flowRunId = apId()
        const context = await aiCallContext.forFlowRun({ flowRunId, projectId: apId() })
        expect(context).toEqual({ origin: AiUsageOrigin.FLOW_STEP, environment: AiUsageEnvironment.PRODUCTION, flowRunId, flowId })
        expect(savedRun).not.toHaveBeenCalled()
    })

    it('falls back to the saved run and marks test runs as testing', async () => {
        queuedRun.mockResolvedValue(null)
        const flowId = apId()
        savedRun.mockResolvedValue({ flowId, environment: RunEnvironment.TESTING })
        const context = await aiCallContext.forFlowRun({ flowRunId: apId(), projectId: apId() })
        expect(context.environment).toBe(AiUsageEnvironment.TESTING)
        expect(context.flowId).toBe(flowId)
    })

    it('caches a run so the second AI call of the same run does no lookup', async () => {
        queuedRun.mockResolvedValue(null)
        savedRun.mockResolvedValue(null)
        const ref = { flowRunId: apId(), projectId: apId() }
        await aiCallContext.runOf(ref)
        await aiCallContext.runOf(ref)
        expect(savedRun).toHaveBeenCalledTimes(1)
    })
})
