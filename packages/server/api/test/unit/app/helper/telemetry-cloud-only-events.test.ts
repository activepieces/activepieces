import { ApEdition, SignUpMethod, TelemetryEvent, TelemetryEventName } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCapture, mockAlias, mockGetEdition, mockIsProductTelemetryEnabled } = vi.hoisted(() => ({
    mockCapture: vi.fn<(message: CapturedMessage) => void>(),
    mockAlias: vi.fn(),
    mockGetEdition: vi.fn(),
    mockIsProductTelemetryEnabled: vi.fn().mockResolvedValue(true),
}))

vi.mock('posthog-node', () => ({
    PostHog: vi.fn(() => ({ capture: mockCapture, alias: mockAlias, identify: vi.fn(), groupIdentify: vi.fn(), flush: vi.fn(), shutdown: vi.fn() })),
}))

vi.mock('../../../../src/app/platform/platform-configuration.service', () => ({
    platformConfigurationService: vi.fn(() => ({
        isProductTelemetryEnabled: mockIsProductTelemetryEnabled,
    })),
}))

vi.mock('../../../../src/app/platform/platform.service', () => ({
    platformService: vi.fn(() => ({ getOneOrThrow: vi.fn().mockResolvedValue({ ownerId: 'owner-1' }) })),
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({ getOne: vi.fn().mockResolvedValue({ id: 'project-1', ownerId: 'owner-1', platformId: 'platform-1' }) })),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getEdition: mockGetEdition, get: vi.fn(() => 'prod') },
}))

import { telemetry } from '../../../../src/app/helper/telemetry.utils'

const mockLog = {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(), level: 'info',
} as unknown as Parameters<typeof telemetry>[0]

const trackSignedIn = (edition: ApEdition) => {
    mockGetEdition.mockReturnValue(edition)
    return telemetry(mockLog).trackUser({
        userId: 'user-1',
        platformId: 'platform-1',
        event: {
            name: TelemetryEventName.SIGNED_IN,
            payload: { userId: 'user-1', platformId: 'platform-1', method: SignUpMethod.PASSWORD },
        },
    })
}

const trackFlowCreated = (edition: ApEdition) => {
    mockGetEdition.mockReturnValue(edition)
    return telemetry(mockLog).trackUser({
        userId: 'user-1',
        platformId: 'platform-1',
        event: {
            name: TelemetryEventName.CREATED_FLOW,
            payload: { flowId: 'flow-1' },
        },
    })
}

const trackPlanUpgraded = (edition: ApEdition) => {
    mockGetEdition.mockReturnValue(edition)
    return telemetry(mockLog).trackPlatform({
        platformId: 'platform-1',
        event: {
            name: TelemetryEventName.PLAN_UPGRADED,
            payload: { platformId: 'platform-1', plan: 'plus', previousPlan: 'free' },
        },
    })
}

const CLOUD_ONLY_BILLING_AND_ONBOARDING_EVENTS: TelemetryEvent[] = [
    { name: TelemetryEventName.ONBOARDING_COMPLETED, payload: { userId: 'user-1', platformId: 'platform-1' } },
    { name: TelemetryEventName.CHECKOUT_STARTED, payload: { platformId: 'platform-1', plan: 'plus' } },
    { name: TelemetryEventName.PLAN_CANCELLED, payload: { platformId: 'platform-1', plan: 'plus' } },
    { name: TelemetryEventName.PLAN_REACTIVATED, payload: { platformId: 'platform-1', plan: 'plus' } },
    { name: TelemetryEventName.TRIAL_STARTED, payload: { platformId: 'platform-1', plan: 'plus', trialEndsAt: '2030-01-01T00:00:00.000Z' } },
]

const capturedEventNames = (): string[] => mockCapture.mock.calls.map(([message]) => message.event)

const capturedDistinctIds = (): string[] => mockCapture.mock.calls.map(([message]) => message.distinctId)

describe('cloud-only telemetry events', () => {
    beforeEach(() => {
        mockCapture.mockClear()
        mockAlias.mockClear()
        mockIsProductTelemetryEnabled.mockResolvedValue(true)
    })

    it('should send an account event on cloud', async () => {
        await trackSignedIn(ApEdition.CLOUD)

        expect(mockCapture).toHaveBeenCalledTimes(1)
        expect(capturedEventNames()).toEqual([TelemetryEventName.SIGNED_IN])
    })

    it.each([ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
        'should drop an account event on %s even with product telemetry on',
        async (edition) => {
            await trackSignedIn(edition)

            expect(mockCapture).not.toHaveBeenCalled()
        },
    )

    it.each([ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
        'should drop a billing event on %s',
        async (edition) => {
            await trackPlanUpgraded(edition)

            expect(mockCapture).not.toHaveBeenCalled()
        },
    )

    it('should send a billing event on cloud attributed to the platform owner', async () => {
        await trackPlanUpgraded(ApEdition.CLOUD)

        expect(capturedEventNames()).toEqual([TelemetryEventName.PLAN_UPGRADED])
        expect(capturedDistinctIds()).toEqual(['owner-1'])
    })

    it.each(CLOUD_ONLY_BILLING_AND_ONBOARDING_EVENTS)('should treat $name as cloud-only', async (event) => {
        mockGetEdition.mockReturnValue(ApEdition.ENTERPRISE)

        await telemetry(mockLog).trackUser({ userId: 'user-1', platformId: 'platform-1', event })

        expect(mockCapture).not.toHaveBeenCalled()
    })

    it.each([ApEdition.CLOUD, ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
        'should still send a product event on %s',
        async (edition) => {
            await trackFlowCreated(edition)

            expect(mockCapture).toHaveBeenCalledTimes(1)
            expect(capturedEventNames()).toEqual([TelemetryEventName.CREATED_FLOW])
        },
    )

    it('should keep honouring the platform switch for the events it does send', async () => {
        mockIsProductTelemetryEnabled.mockResolvedValue(false)

        await trackFlowCreated(ApEdition.COMMUNITY)

        expect(mockCapture).not.toHaveBeenCalled()
    })
})

describe('actor attribution', () => {
    beforeEach(() => {
        mockCapture.mockClear()
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)
        mockIsProductTelemetryEnabled.mockResolvedValue(true)
    })

    it('should use the actor as distinct_id on trackProject when given', async () => {
        await telemetry(mockLog).trackProject({
            projectId: 'project-1',
            actorUserId: 'actor-1',
            event: { name: TelemetryEventName.FLOW_PUBLISHED, payload: { flowId: 'flow-1' } },
        })

        expect(capturedDistinctIds()).toEqual(['actor-1'])
    })

    it('should fall back to the project owner on trackProject', async () => {
        await telemetry(mockLog).trackProject({
            projectId: 'project-1',
            event: { name: TelemetryEventName.FLOW_PUBLISHED, payload: { flowId: 'flow-1' } },
        })

        expect(capturedDistinctIds()).toEqual(['owner-1'])
    })

    it('should stamp every event with the deployment kind', async () => {
        await trackFlowCreated(ApEdition.CLOUD)

        expect(mockCapture.mock.calls[0][0].properties.deployment).toBe('cloud')
    })
})

describe('identity-level tracking', () => {
    beforeEach(() => {
        mockCapture.mockClear()
        mockAlias.mockClear()
        mockIsProductTelemetryEnabled.mockResolvedValue(true)
    })

    it('should send identity events with the identity id as distinct_id', async () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)

        await telemetry(mockLog).trackIdentity({
            identityId: 'identity-1',
            platformId: null,
            event: { name: TelemetryEventName.EMAIL_CODE_REQUESTED, payload: { isNewIdentity: true } },
        })

        expect(capturedDistinctIds()).toEqual(['identity-1'])
    })

    it('should drop platform-less identity events outside cloud', async () => {
        mockGetEdition.mockReturnValue(ApEdition.ENTERPRISE)

        await telemetry(mockLog).trackIdentity({
            identityId: 'identity-1',
            platformId: null,
            event: { name: TelemetryEventName.EMAIL_CODE_REQUESTED, payload: { isNewIdentity: true } },
        })

        expect(mockCapture).not.toHaveBeenCalled()
    })

    it('should alias the identity onto the user on cloud', async () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)

        await telemetry(mockLog).aliasIdentity({ identityId: 'identity-1', userId: 'user-1', platformId: 'platform-1' })

        expect(mockAlias).toHaveBeenCalledWith({ distinctId: 'user-1', alias: 'identity-1' })
    })

    it('should not alias outside cloud', async () => {
        mockGetEdition.mockReturnValue(ApEdition.ENTERPRISE)

        await telemetry(mockLog).aliasIdentity({ identityId: 'identity-1', userId: 'user-1', platformId: 'platform-1' })

        expect(mockAlias).not.toHaveBeenCalled()
    })
})

type CapturedMessage = {
    event: string
    distinctId: string
    properties: Record<string, unknown>
}
