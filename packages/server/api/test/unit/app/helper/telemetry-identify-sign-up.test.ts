import { SignUpMethod } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockIdentify, mockIsProductTelemetryEnabled } = vi.hoisted(() => ({
    mockIdentify: vi.fn<(message: IdentifyMessage) => void>(),
    mockIsProductTelemetryEnabled: vi.fn().mockResolvedValue(true),
}))

vi.mock('posthog-node', () => ({
    PostHog: vi.fn(() => ({ identify: mockIdentify, capture: vi.fn(), flush: vi.fn(), shutdown: vi.fn() })),
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
    system: { getEdition: vi.fn(() => 'cloud'), get: vi.fn(() => 'prod') },
}))

import { telemetry } from '../../../../src/app/helper/telemetry.utils'

const mockLog = {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(), level: 'info',
} as unknown as Parameters<typeof telemetry>[0]

const identifySignUp = (attribution: Record<string, string> | undefined): Promise<void> => telemetry(mockLog).identifySignUp({
    userId: 'user-1',
    platformId: 'platform-1',
    method: SignUpMethod.GOOGLE,
    attribution,
})

describe('identifySignUp', () => {
    beforeEach(() => {
        mockIdentify.mockClear()
        mockIsProductTelemetryEnabled.mockResolvedValue(true)
    })

    it('should stamp the sign-up method and attribution once on the user', async () => {
        await identifySignUp({ utm_source: 'google', gclid: 'abc', ap_sid: 'sid-1' })

        expect(mockIdentify).toHaveBeenCalledTimes(1)
        expect(mockIdentify.mock.calls[0][0]).toEqual({
            distinctId: 'user-1',
            properties: {
                $set_once: { signup_method: 'google', utm_source: 'google', gclid: 'abc', ap_sid: 'sid-1' },
            },
        })
    })

    it('should stamp only the method when no attribution was sent', async () => {
        await identifySignUp(undefined)

        expect(mockIdentify.mock.calls[0][0].properties.$set_once).toEqual({ signup_method: 'google' })
    })

    it('should stay silent when the platform turned product telemetry off', async () => {
        mockIsProductTelemetryEnabled.mockResolvedValue(false)

        await identifySignUp({ utm_source: 'google' })

        expect(mockIdentify).not.toHaveBeenCalled()
    })
})

type IdentifyMessage = {
    distinctId: string
    properties: { $set_once: Record<string, string> }
}
