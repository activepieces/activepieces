import { posthogConfig } from '@activepieces/server-utils'
import { TelemetryEventName } from '@activepieces/shared'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPostHog, mockCapture } = vi.hoisted(() => {
    const capture = vi.fn()
    return {
        mockCapture: capture,
        mockPostHog: vi.fn(function () {
            return { capture, identify: vi.fn(), alias: vi.fn(), groupIdentify: vi.fn(), flush: vi.fn(), shutdown: vi.fn() }
        }),
    }
})

vi.mock('posthog-node', () => ({ PostHog: mockPostHog }))

vi.mock('../../../../src/app/platform/platform-configuration.service', () => ({
    platformConfigurationService: vi.fn(() => ({ isProductTelemetryEnabled: vi.fn().mockResolvedValue(true) })),
}))

vi.mock('../../../../src/app/platform/platform.service', () => ({
    platformService: vi.fn(() => ({ getOneOrThrow: vi.fn() })),
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({ getOne: vi.fn() })),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getEdition: vi.fn(() => 'cloud'), get: vi.fn(() => 'prod') },
}))

const log = Fastify({ logger: false }).log

describe('PostHog project token', () => {
    beforeEach(() => {
        vi.resetModules()
        mockPostHog.mockClear()
        mockCapture.mockClear()
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('sends product events with the token that AP_POSTHOG_PROJECT_TOKEN names', async () => {
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', 'phc_staging')
        const { telemetry } = await import('../../../../src/app/helper/telemetry.utils')

        await trackFlowPublished(telemetry)

        expect(mockPostHog).toHaveBeenCalledTimes(1)
        expect(mockPostHog.mock.calls[0][0]).toBe('phc_staging')
        expect(mockCapture).toHaveBeenCalledTimes(1)
    })

    it('sends no product events when AP_POSTHOG_PROJECT_TOKEN is empty', async () => {
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', '')
        const { telemetry } = await import('../../../../src/app/helper/telemetry.utils')

        await trackFlowPublished(telemetry)

        expect(mockPostHog).not.toHaveBeenCalled()
        expect(mockCapture).not.toHaveBeenCalled()
    })

    it('keeps sending license-key events with the built-in token when AP_POSTHOG_PROJECT_TOKEN is empty', async () => {
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', '')
        const { captureLicenseKeyEvent, LicenseKeyPostHogEvents } = await import('../../../../src/app/helper/telemetry.utils')

        captureLicenseKeyEvent({
            licenseKey: 'license-1',
            event: LicenseKeyPostHogEvents.CHAT_MESSAGE,
            properties: { provider: null, model: null, toolsUsed: 0 },
        })

        expect(mockPostHog).toHaveBeenCalledTimes(1)
        expect(mockPostHog.mock.calls[0][0]).toBe(posthogConfig.meteringProjectToken)
        expect(mockCapture).toHaveBeenCalledTimes(1)
    })
})

function trackFlowPublished(telemetry: TelemetryFactory): Promise<void> {
    return telemetry(log).trackUser({
        userId: 'user-1',
        platformId: 'platform-1',
        event: { name: TelemetryEventName.FLOW_PUBLISHED, payload: { flowId: 'flow-1' } },
    })
}

type TelemetryFactory = typeof import('../../../../src/app/helper/telemetry.utils')['telemetry']
