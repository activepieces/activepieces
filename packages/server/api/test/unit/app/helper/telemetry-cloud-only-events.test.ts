import { ApEdition, TelemetryEventName } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCapture, mockGetEdition, mockIsProductTelemetryEnabled } = vi.hoisted(() => ({
    mockCapture: vi.fn(),
    mockGetEdition: vi.fn(),
    mockIsProductTelemetryEnabled: vi.fn().mockResolvedValue(true),
}))

vi.mock('posthog-node', () => ({
    PostHog: vi.fn(() => ({ capture: mockCapture, identify: vi.fn(), flush: vi.fn(), shutdown: vi.fn() })),
}))

vi.mock('../../../../src/app/platform/platform-configuration.service', () => ({
    platformConfigurationService: vi.fn(() => ({
        isProductTelemetryEnabled: mockIsProductTelemetryEnabled,
    })),
}))

vi.mock('../../../../src/app/platform/platform.service', () => ({
    platformService: vi.fn(() => ({ getOneOrThrow: vi.fn() })),
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({ getOne: vi.fn() })),
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
            payload: { userId: 'user-1', platformId: 'platform-1' },
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

describe('cloud-only telemetry events', () => {
    beforeEach(() => {
        mockCapture.mockClear()
        mockIsProductTelemetryEnabled.mockResolvedValue(true)
    })

    it('should send an account event on cloud', async () => {
        await trackSignedIn(ApEdition.CLOUD)

        expect(mockCapture).toHaveBeenCalledTimes(1)
        expect(mockCapture.mock.calls[0][0].event).toBe(TelemetryEventName.SIGNED_IN)
    })

    it.each([ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
        'should drop an account event on %s even with product telemetry on',
        async (edition) => {
            await trackSignedIn(edition)

            expect(mockCapture).not.toHaveBeenCalled()
        },
    )

    it.each([ApEdition.CLOUD, ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
        'should still send a product event on %s',
        async (edition) => {
            await trackFlowCreated(edition)

            expect(mockCapture).toHaveBeenCalledTimes(1)
            expect(mockCapture.mock.calls[0][0].event).toBe(TelemetryEventName.CREATED_FLOW)
        },
    )

    it('should keep honouring the platform switch for the events it does send', async () => {
        mockIsProductTelemetryEnabled.mockResolvedValue(false)

        await trackFlowCreated(ApEdition.COMMUNITY)

        expect(mockCapture).not.toHaveBeenCalled()
    })
})
