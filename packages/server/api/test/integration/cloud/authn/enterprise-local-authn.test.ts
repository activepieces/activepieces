import { OtpState, OtpType } from '@activepieces/ee-shared'
import { UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { createMockOtp, mockBasicUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Enterprise Local Authn API', () => {
    describe('Verify Email Endpoint', () => {
        it('Verifies user', async () => {
            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                },
                userIdentity: {
                    verified: false,
                },
            })
            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.EMAIL_VERIFICATION,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                identityId: mockUserIdentity.id,
                otp: mockOtp.value,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.body).toBe('')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.verified).toBe(true)
            const otp = await databaseConnection()
                .getRepository('otp')
                .findOneBy({ id: mockOtp.id })
            expect(otp?.state).toBe(OtpState.CONFIRMED)
        })

        it('Fails if OTP is wrong', async () => {
            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                },
                userIdentity: {
                    verified: false,
                },
            })
            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.EMAIL_VERIFICATION,
                value: correctOtp,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const incorrectOtp = '654321'
            const mockVerifyEmailRequest = {
                identityId: mockUserIdentity.id,
                otp: incorrectOtp,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.GONE)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.verified).toBe(false)
        })

        it('Fails if OTP has expired', async () => {
            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                },
                userIdentity: {
                    verified: false,
                },
            })

            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.EMAIL_VERIFICATION,
                updated: dayjs().subtract(31, 'minutes').toISOString(),
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                identityId: mockUserIdentity.id,
                otp: mockOtp.value,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.GONE)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.verified).toBe(false)
        })

        it('Fails if OTP was confirmed before', async () => {
            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                },
                userIdentity: {
                    verified: false,
                },
            })

            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.EMAIL_VERIFICATION,
                state: OtpState.CONFIRMED,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                identityId: mockUserIdentity.id,
                otp: mockOtp.value,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.GONE)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.verified).toBe(false)
        })
    })

    describe('Reset Password Endpoint', () => {
        it('Updates user password', async () => {
            const { mockUserIdentity } = await mockBasicUser({
                userIdentity: {                },
            })

            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.PASSWORD_RESET,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockResetPasswordRequest = {
                identityId: mockUserIdentity.id,
                otp: mockOtp.value,
                newPassword: 'newPassword',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/reset-password',
                body: mockResetPasswordRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.body).toBe('')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.password).not.toBe(mockUserIdentity.password)
        })

        it('Fails if OTP is wrong', async () => {
            const { mockUserIdentity } = await mockBasicUser({

            })

            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                identityId: mockUserIdentity.id,
                type: OtpType.PASSWORD_RESET,
                value: correctOtp,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const incorrectOtp = '654321'
            const mockResetPasswordRequest = {
                identityId: mockUserIdentity.id,
                otp: incorrectOtp,
                newPassword: 'newPassword',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/reset-password',
                body: mockResetPasswordRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.GONE)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const userIdentity = await databaseConnection()
                .getRepository('user_identity')
                .findOneBy({ id: mockUserIdentity.id })
            expect(userIdentity?.password).toBe(mockUserIdentity.password)
        })
    })
})
