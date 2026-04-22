import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ApEdition,
    PrincipalType,
    UserIdentityProvider,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as emailServiceFile from '../../../../src/app/ee/helper/email/email-service'
import { system } from '../../../../src/app/helper/system/system'
import { generateMockToken } from '../../../helpers/auth'
import {
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import {
    createMockSignInRequest,
    createMockSignUpRequest,
} from '../../../helpers/mocks/authn'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    vi.spyOn(emailServiceFile, 'emailService').mockImplementation((_log: FastifyBaseLogger) => ({
        sendOtp: vi.fn(),
        sendInvitation: vi.fn(),
        sendIssueCreatedNotification: vi.fn(),
        sendQuotaAlert: vi.fn(),
        sendTrialReminder: vi.fn(),
        sendReminderJobHandler: vi.fn(),
        sendExceedFailureThresholdAlert: vi.fn(),
        sendBadgeAwardedEmail: vi.fn(),
        sendProjectMemberAdded: vi.fn(),
    }))

    await databaseConnection().getRepository('flag').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
    await databaseConnection().query('TRUNCATE TABLE "session", "account", "verification", "rateLimit", "twoFactor" CASCADE')
})

describe('2FA API', () => {

    describe('GET /2fa-status', () => {

        it('should return disabled status when user has no 2FA', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toEqual({
                enabled: false,
                backupCodesRemaining: 0,
                hasPassword: true,
            })
        })

        it('should return enabled status when user has 2FA enabled', async () => {
            const { mockOwner, mockPlatform, mockUserIdentity } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user_identity').update(
                mockUserIdentity.id,
                { twoFactorEnabled: true },
            )

            // Insert twoFactor row with backup codes
            const backupCodes = JSON.stringify(['code1', 'code2', 'code3'])
            await databaseConnection().query(
                `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId", "verified", "createdAt", "updatedAt")
                 VALUES ($1, 'test-secret', $2, $3, true, NOW(), NOW())`,
                [faker.string.alphanumeric(21), backupCodes, mockUserIdentity.id],
            )

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toEqual({
                enabled: true,
                backupCodesRemaining: 3,
                hasPassword: true,
            })
        })

        it('should return hasPassword false for SSO users', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                userIdentity: { provider: UserIdentityProvider.GOOGLE },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.hasPassword).toBe(false)
        })

        it('should return 0 backup codes when twoFactor row has no backup codes', async () => {
            const { mockOwner, mockPlatform, mockUserIdentity } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user_identity').update(
                mockUserIdentity.id,
                { twoFactorEnabled: true },
            )

            await databaseConnection().query(
                `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId", "verified", "createdAt", "updatedAt")
                 VALUES ($1, 'test-secret', NULL, $2, true, NOW(), NOW())`,
                [faker.string.alphanumeric(21), mockUserIdentity.id],
            )

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.backupCodesRemaining).toBe(0)
        })
    })

    describe('Sign-in with enforced TOTP', () => {

        it('should return MFA challenge when platform enforces TOTP and user has not set it up', async () => {
            const mockSignUpRequest = createMockSignUpRequest()

            // Sign up first
            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // Update platform to enforce TOTP
            const identity = await databaseConnection().getRepository('user_identity').findOneByOrFail({ email: mockSignUpRequest.email.toLowerCase().trim() })
            const user = await databaseConnection().getRepository('user').findOneByOrFail({ identityId: identity.id })
            await databaseConnection().getRepository('platform').update(
                user.platformId,
                { enforceTotp: true },
            )
            // Verify identity email for sign-in
            await databaseConnection().getRepository('user_identity').update(
                identity.id,
                { emailVerified: true },
            )

            const signInResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({
                    email: mockSignUpRequest.email,
                    password: mockSignUpRequest.password,
                }),
            })

            expect(signInResponse?.statusCode).toBe(StatusCodes.OK)
            const body = signInResponse?.json()
            expect(body.mfaRequired).toBe(true)
            expect(body.setupRequired).toBe(true)
        })

        it('should return normal auth response when platform does not enforce TOTP', async () => {
            const mockSignUpRequest = createMockSignUpRequest()

            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const identity = await databaseConnection().getRepository('user_identity').findOneByOrFail({ email: mockSignUpRequest.email.toLowerCase().trim() })
            await databaseConnection().getRepository('user_identity').update(
                identity.id,
                { emailVerified: true },
            )

            const signInResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({
                    email: mockSignUpRequest.email,
                    password: mockSignUpRequest.password,
                }),
            })

            expect(signInResponse?.statusCode).toBe(StatusCodes.OK)
            const body = signInResponse?.json()
            expect(body.mfaRequired).toBeUndefined()
            expect(body.token).toBeDefined()
            expect(body.id).toBeDefined()
        })
    })

    describe('Sign-in with user 2FA enabled', () => {

        it('should return MFA challenge when user has 2FA enabled', async () => {
            const mockSignUpRequest = createMockSignUpRequest()

            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const identity = await databaseConnection().getRepository('user_identity').findOneByOrFail({ email: mockSignUpRequest.email.toLowerCase().trim() })
            await databaseConnection().getRepository('user_identity').update(
                identity.id,
                { emailVerified: true, twoFactorEnabled: true },
            )

            // Insert twoFactor row to simulate completed 2FA setup
            await databaseConnection().query(
                `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId", "verified", "createdAt", "updatedAt")
                 VALUES ($1, 'JBSWY3DPEHPK3PXP', '["backup1","backup2"]', $2, true, NOW(), NOW())`,
                [faker.string.alphanumeric(21), identity.id],
            )

            const signInResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({
                    email: mockSignUpRequest.email,
                    password: mockSignUpRequest.password,
                }),
            })

            expect(signInResponse?.statusCode).toBe(StatusCodes.OK)
            const body = signInResponse?.json()
            expect(body.mfaRequired).toBe(true)
        })
    })

    describe('Sign-up MFA setup', () => {

        it('should return MFA setup challenge on sign-up', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)

            const mockSignUpRequest = createMockSignUpRequest()

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.mfaRequired).toBe(true)
            expect(body.setupRequired).toBe(true)
        })
    })

    describe('Backup codes', () => {

        it('should count remaining backup codes correctly', async () => {
            const { mockOwner, mockPlatform, mockUserIdentity } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user_identity').update(
                mockUserIdentity.id,
                { twoFactorEnabled: true },
            )

            const codes = ['code-a', 'code-b', 'code-c', 'code-d', 'code-e']
            await databaseConnection().query(
                `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId", "verified", "createdAt", "updatedAt")
                 VALUES ($1, 'test-secret', $2, $3, true, NOW(), NOW())`,
                [faker.string.alphanumeric(21), JSON.stringify(codes), mockUserIdentity.id],
            )

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.backupCodesRemaining).toBe(5)
        })

        it('should return 0 when backup codes JSON is invalid', async () => {
            const { mockOwner, mockPlatform, mockUserIdentity } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user_identity').update(
                mockUserIdentity.id,
                { twoFactorEnabled: true },
            )

            await databaseConnection().query(
                `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId", "verified", "createdAt", "updatedAt")
                 VALUES ($1, 'test-secret', 'not-valid-json', $2, true, NOW(), NOW())`,
                [faker.string.alphanumeric(21), mockUserIdentity.id],
            )

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/authentication/2fa-status',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.backupCodesRemaining).toBe(0)
        })
    })
})
