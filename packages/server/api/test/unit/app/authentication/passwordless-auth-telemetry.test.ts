import { TelemetryEventName } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockTrackUser,
    mockTrackIdentity,
    mockGetIdentityByEmail,
    mockGetOneByIdentityAndPlatform,
    mockSelectCloudSignInPlatformId,
} = vi.hoisted(() => ({
    mockTrackUser: vi.fn().mockResolvedValue(undefined),
    mockTrackIdentity: vi.fn().mockResolvedValue(undefined),
    mockGetIdentityByEmail: vi.fn(),
    mockGetOneByIdentityAndPlatform: vi.fn(),
    mockSelectCloudSignInPlatformId: vi.fn(),
}))

vi.mock('../../../../src/app/authentication/lib/turnstile', () => ({
    turnstile: { assertSolved: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../../../src/app/authentication/lib/zerobounce', () => ({
    zerobounce: { maySignUp: vi.fn().mockResolvedValue(true) },
}))

vi.mock('../../../../src/app/authentication/otp/otp-service', () => ({
    otpService: vi.fn(() => ({ createAndSend: vi.fn().mockResolvedValue(undefined) })),
}))

vi.mock('../../../../src/app/authentication/user-identity/user-identity-service', () => ({
    userIdentityService: vi.fn(() => ({
        getIdentityByEmail: mockGetIdentityByEmail,
        create: vi.fn(),
    })),
}))

vi.mock('../../../../src/app/user/user-service', () => ({
    userService: vi.fn(() => ({ getOneByIdentityAndPlatform: mockGetOneByIdentityAndPlatform })),
}))

vi.mock('../../../../src/app/authentication/authentication.service', () => ({
    authenticationService: vi.fn(() => ({ selectCloudSignInPlatformId: mockSelectCloudSignInPlatformId })),
}))

vi.mock('../../../../src/app/helper/telemetry.utils', () => ({
    telemetry: vi.fn(() => ({ trackUser: mockTrackUser, trackIdentity: mockTrackIdentity })),
}))

import { passwordlessAuthService } from '../../../../src/app/authentication/passwordless-auth.service'

const mockLog = {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(), level: 'info',
} as unknown as Parameters<typeof passwordlessAuthService>[0]

const EMAIL = 'someone@example.com'
const IDENTITY = { id: 'identity-1', email: EMAIL }

async function requestCodeAndFlush(): Promise<void> {
    await passwordlessAuthService(mockLog).requestCode({
        email: EMAIL,
        platformId: null,
        captchaToken: 'token',
        remoteIp: '127.0.0.1',
    })
    await new Promise((resolve) => setImmediate(resolve))
}

describe('passwordless auth telemetry distinct id', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetIdentityByEmail.mockResolvedValue(IDENTITY)
        mockSelectCloudSignInPlatformId.mockResolvedValue('platform-1')
    })

    it('keys the event on the identity id while no user exists yet', async () => {
        mockGetOneByIdentityAndPlatform.mockResolvedValue(null)

        await requestCodeAndFlush()

        expect(mockTrackUser).not.toHaveBeenCalled()
        expect(mockTrackIdentity).toHaveBeenCalledWith({
            identityId: 'identity-1',
            platformId: 'platform-1',
            event: {
                name: TelemetryEventName.EMAIL_CODE_REQUESTED,
                payload: { isNewIdentity: false },
            },
        })
    })

    it('switches to the user id as soon as a user exists for identity and platform', async () => {
        mockGetOneByIdentityAndPlatform.mockResolvedValue({ id: 'user-1' })

        await requestCodeAndFlush()

        expect(mockTrackIdentity).not.toHaveBeenCalled()
        expect(mockTrackUser).toHaveBeenCalledWith({
            userId: 'user-1',
            platformId: 'platform-1',
            event: {
                name: TelemetryEventName.EMAIL_CODE_REQUESTED,
                payload: { isNewIdentity: false },
            },
        })
    })

    it('keys the event on the identity id when no platform can be resolved', async () => {
        mockSelectCloudSignInPlatformId.mockResolvedValue(null)
        mockGetOneByIdentityAndPlatform.mockResolvedValue({ id: 'user-1' })

        await requestCodeAndFlush()

        expect(mockGetOneByIdentityAndPlatform).not.toHaveBeenCalled()
        expect(mockTrackUser).not.toHaveBeenCalled()
        expect(mockTrackIdentity).toHaveBeenCalledWith({
            identityId: 'identity-1',
            platformId: null,
            event: {
                name: TelemetryEventName.EMAIL_CODE_REQUESTED,
                payload: { isNewIdentity: false },
            },
        })
    })
})
