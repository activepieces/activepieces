import { ErrorCode } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as OTPAuth from 'otpauth'
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { totpUtils } from '../../../../src/app/authentication/lib/totp-utils'
import { UserIdentityEntity } from '../../../../src/app/authentication/user-identity/user-identity-entity'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { CLOUD_PLATFORM_ID, mockAndSaveBasicSetup } from '../../../helpers/mocks'

// Fastify logger stub used when calling service helpers directly in tests
const stubLog = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: () => stubLog,
} as unknown as import('fastify').FastifyBaseLogger

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('flag').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate the current valid TOTP code for a given base32 secret. */
function generateTotpCode(secret: string): string {
    const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
    })
    return totp.generate()
}

const KNOWN_PASSWORD = 'Test1234!'

/**
 * Create a user+platform in the DB with a known password so we can call
 * the sign-in endpoint in tests without going through the HTTP sign-up flow
 * (which behaves differently in cloud vs CE edition).
 */
async function createUserWithKnownPassword() {
    const { mockUserIdentity, mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
        platform: { id: CLOUD_PLATFORM_ID },
        // customDomainsEnabled: false so getPersonalPlatformIdForIdentity doesn't exclude this platform
        // when resolving it for cloud-edition sign-in (no Host header in tests)
        plan: { customDomainsEnabled: false },
        userIdentity: { password: KNOWN_PASSWORD },
    })
    return { identity: mockUserIdentity, user: mockOwner, platform: mockPlatform }
}

/** Enable TOTP for an identity by writing directly to the DB (bypasses code verification). */
async function enableTotpForIdentity(identityId: string) {
    const { secret, otpauthUrl, qrCodeDataUrl } = await totpUtils.generateSecret({
        email: 'test@example.com',
        issuer: 'Activepieces',
    })
    const encryptedSecret = await totpUtils.encryptSecret({ secret })
    const rawCodes = totpUtils.generateBackupCodes()
    const backupCodes = await Promise.all(
        rawCodes.map(async (c) => ({ hash: await totpUtils.hashBackupCode({ code: c }), used: false })),
    )
    await databaseConnection()
        .getRepository(UserIdentityEntity)
        .update(identityId, { totpEnabled: true, totpSecret: encryptedSecret, backupCodes })
    return { secret, otpauthUrl, qrCodeDataUrl, rawCodes }
}

// ---------------------------------------------------------------------------
// GET /status
// ---------------------------------------------------------------------------

describe('GET /v1/authentication/2fa/status', () => {
    it('returns disabled with zero backup codes when 2FA is not set up', async () => {
        const ctx: TestContext = await createTestContext(app!)

        const res = await ctx.get('/v1/authentication/2fa/status')

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.enabled).toBe(false)
        expect(body.backupCodesRemaining).toBe(0)
    })

    it('returns enabled with correct remaining backup codes when 2FA is active', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { rawCodes } = await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.get('/v1/authentication/2fa/status')

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.enabled).toBe(true)
        expect(body.backupCodesRemaining).toBe(rawCodes.length)
    })

    it('returns 401 when no auth token is provided', async () => {
        const res = await app!.inject({
            method: 'GET',
            url: '/api/v1/authentication/2fa/status',
        })
        expect(res.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

// ---------------------------------------------------------------------------
// POST /setup
// ---------------------------------------------------------------------------

describe('POST /v1/authentication/2fa/setup', () => {
    it('returns secret, otpauthUrl and qrCodeDataUrl', async () => {
        const ctx: TestContext = await createTestContext(app!)

        const res = await ctx.post('/v1/authentication/2fa/setup')

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(typeof body.secret).toBe('string')
        expect(body.secret.length).toBeGreaterThan(0)
        expect(body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//)
        expect(body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/)
    })

    it('stores an encrypted secret in the DB', async () => {
        const ctx: TestContext = await createTestContext(app!)

        await ctx.post('/v1/authentication/2fa/setup')

        const identity = await databaseConnection()
            .getRepository(UserIdentityEntity)
            .findOneByOrFail({ id: ctx.userIdentity.id })
        expect(identity.totpSecret).not.toBeNull()
        // totpEnabled stays false until /enable is called
        expect(identity.totpEnabled).toBe(false)
    })

    it('returns 401 when no auth token is provided', async () => {
        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/setup',
        })
        expect(res.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

// ---------------------------------------------------------------------------
// POST /enable
// ---------------------------------------------------------------------------

describe('POST /v1/authentication/2fa/enable', () => {
    it('enables 2FA and returns 8 backup codes when the TOTP code is valid', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const setupRes = await ctx.post('/v1/authentication/2fa/setup')
        const { secret } = setupRes.json()

        const res = await ctx.post('/v1/authentication/2fa/enable', { code: generateTotpCode(secret) })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(Array.isArray(body.backupCodes)).toBe(true)
        expect(body.backupCodes).toHaveLength(8)

        const identity = await databaseConnection()
            .getRepository(UserIdentityEntity)
            .findOneByOrFail({ id: ctx.userIdentity.id })
        expect(identity.totpEnabled).toBe(true)
    })

    it('returns INVALID_2FA_CODE when the TOTP code is wrong', async () => {
        const ctx: TestContext = await createTestContext(app!)
        await ctx.post('/v1/authentication/2fa/setup')

        const res = await ctx.post('/v1/authentication/2fa/enable', { code: '000000' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })

    it('returns MFA_NOT_ENABLED when setup was never called', async () => {
        const ctx: TestContext = await createTestContext(app!)

        const res = await ctx.post('/v1/authentication/2fa/enable', { code: '123456' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.MFA_NOT_ENABLED)
    })

    it('returns MFA_ALREADY_ENABLED when 2FA is already active', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { secret } = await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/enable', { code: generateTotpCode(secret) })

        expect(res.statusCode).toBe(StatusCodes.CONFLICT)
        expect(res.json().code).toBe(ErrorCode.MFA_ALREADY_ENABLED)
    })
})

// ---------------------------------------------------------------------------
// POST /disable
// ---------------------------------------------------------------------------

describe('POST /v1/authentication/2fa/disable', () => {
    it('disables 2FA and clears the secret when TOTP code is valid', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { secret } = await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/disable', { code: generateTotpCode(secret) })

        expect(res.statusCode).toBe(StatusCodes.OK)

        const identity = await databaseConnection()
            .getRepository(UserIdentityEntity)
            .findOneByOrFail({ id: ctx.userIdentity.id })
        expect(identity.totpEnabled).toBe(false)
        expect(identity.totpSecret).toBeNull()
        expect(identity.backupCodes).toBeNull()
    })

    it('disables 2FA when a valid backup code is used', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { rawCodes } = await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/disable', { code: rawCodes[0] })

        expect(res.statusCode).toBe(StatusCodes.OK)

        const identity = await databaseConnection()
            .getRepository(UserIdentityEntity)
            .findOneByOrFail({ id: ctx.userIdentity.id })
        expect(identity.totpEnabled).toBe(false)
    })

    it('returns INVALID_2FA_CODE when both TOTP and backup code are wrong', async () => {
        const ctx: TestContext = await createTestContext(app!)
        await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/disable', { code: 'BADCODE1' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })

    it('returns MFA_NOT_ENABLED when 2FA is not active', async () => {
        const ctx: TestContext = await createTestContext(app!)

        const res = await ctx.post('/v1/authentication/2fa/disable', { code: '123456' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.MFA_NOT_ENABLED)
    })
})

// ---------------------------------------------------------------------------
// POST /verify  (public — called during sign-in with mfaToken)
// ---------------------------------------------------------------------------

describe('POST /v1/authentication/2fa/verify', () => {
    it('returns a full auth token when the TOTP code is valid', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { secret } = await enableTotpForIdentity(ctx.userIdentity.id)

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: ctx.userIdentity.id,
            platformId: ctx.platform.id,
        })

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken, code: generateTotpCode(secret) },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(typeof body.token).toBe('string')
        expect(body.token.length).toBeGreaterThan(0)
    })

    it('returns INVALID_2FA_CODE when the code is wrong', async () => {
        const ctx: TestContext = await createTestContext(app!)
        await enableTotpForIdentity(ctx.userIdentity.id)

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: ctx.userIdentity.id,
            platformId: ctx.platform.id,
        })

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken, code: '000000' },
        })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })

    it('returns INVALID_BEARER_TOKEN when the mfaToken is invalid', async () => {
        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken: 'not-a-real-token', code: '123456' },
        })

        expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it('verifies via backup code when TOTP fails', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { rawCodes } = await enableTotpForIdentity(ctx.userIdentity.id)

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: ctx.userIdentity.id,
            platformId: ctx.platform.id,
        })

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken, code: rawCodes[0] },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        expect(res.json().token).toBeDefined()
    })

    it('rejects a backup code that has already been used', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { rawCodes } = await enableTotpForIdentity(ctx.userIdentity.id)

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: ctx.userIdentity.id,
            platformId: ctx.platform.id,
        })

        // First use succeeds
        await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken, code: rawCodes[0] },
        })

        // Second use of same backup code on a new mfaToken must fail
        const mfaToken2 = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: ctx.userIdentity.id,
            platformId: ctx.platform.id,
        })
        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/verify',
            body: { mfaToken: mfaToken2, code: rawCodes[0] },
        })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })
})

// ---------------------------------------------------------------------------
// POST /backup-codes/regenerate
// ---------------------------------------------------------------------------

describe('POST /v1/authentication/2fa/backup-codes/regenerate', () => {
    it('returns 8 fresh backup codes when TOTP code is valid', async () => {
        const ctx: TestContext = await createTestContext(app!)
        const { secret, rawCodes: original } = await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/backup-codes/regenerate', { code: generateTotpCode(secret) })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.backupCodes).toHaveLength(8)
        // New codes must differ from the originals
        expect(body.backupCodes).not.toEqual(original)
    })

    it('returns INVALID_2FA_CODE when TOTP code is wrong', async () => {
        const ctx: TestContext = await createTestContext(app!)
        await enableTotpForIdentity(ctx.userIdentity.id)

        const res = await ctx.post('/v1/authentication/2fa/backup-codes/regenerate', { code: '000000' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })

    it('returns MFA_NOT_ENABLED when 2FA is not active', async () => {
        const ctx: TestContext = await createTestContext(app!)

        const res = await ctx.post('/v1/authentication/2fa/backup-codes/regenerate', { code: '123456' })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.MFA_NOT_ENABLED)
    })
})

// ---------------------------------------------------------------------------
// Sign-in → MFA challenge flow
// ---------------------------------------------------------------------------

describe('Sign-in with 2FA enabled', () => {
    it('returns mfaRequired:true and an mfaToken instead of a session token', async () => {
        const { identity } = await createUserWithKnownPassword()
        await enableTotpForIdentity(identity.id)

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: identity.email, password: KNOWN_PASSWORD },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.mfaRequired).toBe(true)
        expect(typeof body.mfaToken).toBe('string')
        expect(body.token).toBeUndefined()
    })

    it('returns a normal session token when 2FA is not enabled', async () => {
        const { identity } = await createUserWithKnownPassword()

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: identity.email, password: KNOWN_PASSWORD },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.token).toBeDefined()
        expect(body.mfaRequired).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// Platform enforceTotp → forced setup flow
// ---------------------------------------------------------------------------

describe('Forced TOTP setup (enforceTotp=true)', () => {
    it('sign-in returns setupRequired:true and mfaToken when platform enforces TOTP and user has none', async () => {
        const { identity, platform } = await createUserWithKnownPassword()
        await databaseConnection().getRepository('platform').update(platform.id, { enforceTotp: true })

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: identity.email, password: KNOWN_PASSWORD },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.setupRequired).toBe(true)
        expect(typeof body.mfaToken).toBe('string')
        expect(body.token).toBeUndefined()
    })

    it('sign-in returns mfaRequired when platform enforces TOTP and user already has TOTP enabled', async () => {
        const { identity, platform } = await createUserWithKnownPassword()
        await databaseConnection().getRepository('platform').update(platform.id, { enforceTotp: true })
        await enableTotpForIdentity(identity.id)

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: identity.email, password: KNOWN_PASSWORD },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(body.mfaRequired).toBe(true)
        expect(body.setupRequired).toBeUndefined()
    })

    it('POST /forced-setup returns secret and qrCodeDataUrl for valid mfaToken', async () => {
        const { identity, platform } = await createUserWithKnownPassword()
        await databaseConnection().getRepository('platform').update(platform.id, { enforceTotp: true })

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: identity.id,
            platformId: platform.id,
        })

        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/forced-setup',
            body: { mfaToken },
        })

        expect(res.statusCode).toBe(StatusCodes.OK)
        const body = res.json()
        expect(typeof body.secret).toBe('string')
        expect(body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/)
    })

    it('POST /forced-setup/complete enables TOTP and returns full auth token + backup codes', async () => {
        const { identity, platform } = await createUserWithKnownPassword()
        await databaseConnection().getRepository('platform').update(platform.id, { enforceTotp: true })

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: identity.id,
            platformId: platform.id,
        })

        // Init forced setup to get and store the secret
        const setupRes = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/forced-setup',
            body: { mfaToken },
        })
        const { secret } = setupRes.json()

        // Complete with valid TOTP code
        const mfaToken2 = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: identity.id,
            platformId: platform.id,
        })
        const completeRes = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/forced-setup/complete',
            body: { mfaToken: mfaToken2, code: generateTotpCode(secret) },
        })

        expect(completeRes.statusCode).toBe(StatusCodes.OK)
        const body = completeRes.json()
        expect(typeof body.token).toBe('string')
        expect(Array.isArray(body.backupCodes)).toBe(true)
        expect(body.backupCodes).toHaveLength(8)

        const updatedIdentity = await databaseConnection()
            .getRepository(UserIdentityEntity)
            .findOneByOrFail({ id: identity.id })
        expect(updatedIdentity.totpEnabled).toBe(true)
    })

    it('POST /forced-setup/complete returns INVALID_2FA_CODE for wrong code', async () => {
        const { identity, platform } = await createUserWithKnownPassword()
        await databaseConnection().getRepository('platform').update(platform.id, { enforceTotp: true })

        const mfaToken = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: identity.id,
            platformId: platform.id,
        })

        await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/forced-setup',
            body: { mfaToken },
        })

        const mfaToken2 = await accessTokenManager(stubLog).generateMfaChallengeToken({
            identityId: identity.id,
            platformId: platform.id,
        })
        const res = await app!.inject({
            method: 'POST',
            url: '/api/v1/authentication/2fa/forced-setup/complete',
            body: { mfaToken: mfaToken2, code: '000000' },
        })

        expect(res.statusCode).toBe(StatusCodes.GONE)
        expect(res.json().code).toBe(ErrorCode.INVALID_2FA_CODE)
    })
})
