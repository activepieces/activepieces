import { AIProviderName } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aiUsageService } from '../../../../src/app/ai/ai-usage-service'

const { mockTrackBillingAndSendTelemetry, mockGetOrCreateForPlatform, mockGetNumberOrThrow } = vi.hoisted(() => ({
    mockTrackBillingAndSendTelemetry: vi.fn().mockResolvedValue(undefined),
    mockGetOrCreateForPlatform: vi.fn(),
    mockGetNumberOrThrow: vi.fn(),
}))

vi.mock('../../../../src/app/helper/telemetry.utils', () => ({
    LicenseKeyPostHogEvents: { AI_USAGE_PER_CALL: 'ai_usage_per_call' },
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getEdition: vi.fn().mockReturnValue('cloud'), getNumberOrThrow: mockGetNumberOrThrow },
}))

vi.mock('../../../../src/app/helper/system/system-props', () => ({
    AppSystemProp: { AI_CREDIT_USD_VALUE: 'AI_CREDIT_USD_VALUE' },
}))

vi.mock('../../../../src/app/platform/billing-provider', () => ({
    CreditUsageSource: { AI: 'ai' },
}))

vi.mock('../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: mockTrackBillingAndSendTelemetry,
}))

vi.mock('../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function report(overrides: Record<string, unknown> = {}) {
    return aiUsageService(log as never).reportManagedCall({
        platformId: 'platform-1',
        projectId: 'project-1',
        provider: AIProviderName.ACTIVEPIECES,
        model: 'anthropic/claude-sonnet-4.5',
        generationId: 'gen-abc',
        costUsd: 0.27,
        ...overrides,
    })
}

describe('aiUsageService#reportManagedCall', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetNumberOrThrow.mockReturnValue(0.0005)
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'plus', licenseKey: null })
    })

    it('converts the reported dollar cost into credits at the configured rate', async () => {
        await report()

        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.value).toBe(540)
    })

    it('keeps fractional credits rather than rounding a cheap call up to one', async () => {
        await report({ costUsd: 0.00037 })

        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.value).toBe(0.74)
    })

    it('keys the deduction on the OpenRouter generation id so a replay cannot double bill', async () => {
        await report({ generationId: 'gen-xyz' })

        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.idempotencyKey).toBe('gen-xyz:ai')
    })

    it('deducts nothing for a free model, which reports a real cost of zero', async () => {
        await report({ costUsd: 0, model: 'nvidia/nemotron-3.5-lightning:free' })

        expect(mockTrackBillingAndSendTelemetry).not.toHaveBeenCalled()
    })

    it('refuses to bill a provider we do not pay for, so a BYOK key keeps its own metering', async () => {
        await report({ provider: AIProviderName.OPENAI })

        expect(mockTrackBillingAndSendTelemetry).not.toHaveBeenCalled()
        expect(log.warn).toHaveBeenCalled()
    })

    it('charges AppSumo credits alongside the platform balance on a credited plan', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'appsumo_activepieces_tier1', licenseKey: null })

        await report()

        const { appSumo } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(appSumo?.value).toBe(540)
        expect(appSumo?.idempotencyKey).toBe('gen-abc:appSumoAi')
    })

    it('leaves AppSumo alone on a plan that does not carry those credits', async () => {
        await report()

        const { appSumo } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(appSumo).toBeUndefined()
    })
})
