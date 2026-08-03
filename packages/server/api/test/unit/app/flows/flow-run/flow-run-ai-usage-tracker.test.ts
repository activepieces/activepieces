import { AIProviderName } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockTrackBillableUsage, mockExtractAiUsage, mockFlowVersionHasAiStep, mockGetOrCreateForPlatform, mockGetProject, mockGetStepsOrNull } = vi.hoisted(() => ({
    mockTrackBillableUsage: vi.fn().mockResolvedValue(undefined),
    mockExtractAiUsage: vi.fn(),
    mockFlowVersionHasAiStep: vi.fn().mockReturnValue(true),
    mockGetOrCreateForPlatform: vi.fn(),
    mockGetProject: vi.fn(),
    mockGetStepsOrNull: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/telemetry.utils', () => ({
    BillingEvents: { AI_USAGE_PER_RUN: 'ai_usage_per_run' },
    captureBillingEvent: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: { getEdition: vi.fn().mockReturnValue('cloud') },
}))

vi.mock('../../../../../src/app/platform/billing-provider', () => ({
    CreditUsageSource: { AI: 'ai' },
    toFlowRunCreditProperties: ({ platformId, flowRun }: { platformId: string, flowRun: { projectId: string, flowId: string, id: string, environment: string } }) => ({
        platformId,
        projectId: flowRun.projectId,
        flowId: flowRun.flowId,
        flowRunId: flowRun.id,
        environment: flowRun.environment,
    }),
}))

vi.mock('../../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: mockTrackBillableUsage,
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: () => ({ getOne: mockGetProject }),
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: () => ({ getDataOrUndefined: vi.fn() }),
}))

vi.mock('../../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunService: () => ({ getStepsOrNull: mockGetStepsOrNull }),
}))

vi.mock('../../../../../src/app/flows/flow-run/flow-run-ai-usage-extractor', () => ({
    flowRunAiUsageExtractor: {
        extractAiUsage: mockExtractAiUsage,
        flowVersionHasAiStep: mockFlowVersionHasAiStep,
    },
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const CREATED = '2026-07-01T00:00:00.000Z'
const FIRST_ATTEMPT_START = '2026-07-01T00:00:05.000Z'
const RETRY_ATTEMPT_START = '2026-07-02T09:30:00.000Z'

async function callTrack({ startTime }: { startTime?: string | null }): Promise<void> {
    const { flowRunAiUsageTracker } = await import('../../../../../src/app/flows/flow-run/flow-run-ai-usage-tracker')
    const flowRun = {
        id: 'run-1',
        projectId: 'proj-1',
        flowId: 'flow-1',
        created: CREATED,
        startTime,
        environment: 'PRODUCTION',
        status: 'SUCCEEDED',
    }
    await flowRunAiUsageTracker(noopLogger as never).track({ flowRun: flowRun as never, flowVersion: {} as never })
}

function creditsKeyFromLastCall(): string | undefined {
    return mockTrackBillableUsage.mock.calls[0][0].credits.idempotencyKey
}

function appSumoKeyFromLastCall(): string | undefined {
    return mockTrackBillableUsage.mock.calls[0][0].appSumo?.idempotencyKey
}

describe('flowRunAiUsageTracker.track — idempotency key scoping', () => {
    beforeEach(() => {
        mockTrackBillableUsage.mockClear()
        mockGetProject.mockResolvedValue({ platformId: 'plat-1' })
        mockGetStepsOrNull.mockResolvedValue({})
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'plus', licenseKey: null })
        mockExtractAiUsage.mockResolvedValue({
            messages: 1,
            toolCalls: 0,
            breakdown: [{ provider: AIProviderName.ACTIVEPIECES, model: 'anthropic/claude-haiku-4.5', messages: 1, toolCalls: 0 }],
        })
    })

    it('scopes the key to the attempt start so a retry is not swallowed as a duplicate', async () => {
        await callTrack({ startTime: FIRST_ATTEMPT_START })

        expect(creditsKeyFromLastCall()).toBe(`run-1:ai:${FIRST_ATTEMPT_START}`)
    })

    it('falls back to the run creation time when no start time is recorded', async () => {
        await callTrack({ startTime: null })

        expect(creditsKeyFromLastCall()).toBe(`run-1:ai:${CREATED}`)
    })

    it('gives a retried run a different key than its first attempt', async () => {
        await callTrack({ startTime: FIRST_ATTEMPT_START })
        const firstAttemptKey = creditsKeyFromLastCall()
        mockTrackBillableUsage.mockClear()

        await callTrack({ startTime: RETRY_ATTEMPT_START })

        expect(creditsKeyFromLastCall()).not.toBe(firstAttemptKey)
    })

    it('repeats the same key when the terminal update is redelivered for one attempt', async () => {
        await callTrack({ startTime: FIRST_ATTEMPT_START })
        const firstDeliveryKey = creditsKeyFromLastCall()
        mockTrackBillableUsage.mockClear()

        await callTrack({ startTime: FIRST_ATTEMPT_START })

        expect(creditsKeyFromLastCall()).toBe(firstDeliveryKey)
    })

    it('scopes the AppSumo hard-cap key the same way', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'appsumo_activepieces_tier2', licenseKey: null })

        await callTrack({ startTime: FIRST_ATTEMPT_START })

        expect(appSumoKeyFromLastCall()).toBe(`run-1:appSumoAi:${FIRST_ATTEMPT_START}`)
    })
})
