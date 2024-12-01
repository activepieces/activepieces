import { OtpState, OtpType } from '@activepieces/ee-shared'
import { UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { createMockOtp, createMockUser } from '../../../helpers/mocks'

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
            const mockUser = createMockUser({
                verified: false,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.status).toBe(UserStatus.ACTIVE)
            expect(user?.verified).toBe(true)
            const otp = await databaseConnection()
                .getRepository('otp')
                .findOneBy({ id: mockOtp.id })
            expect(otp?.state).toBe(OtpState.CONFIRMED)
        })

        it('Fails if OTP is wrong', async () => {
            const mockUser = createMockUser({
                verified: false,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
                value: correctOtp,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const incorrectOtp = '654321'
            const mockVerifyEmailRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.status).toBe(UserStatus.ACTIVE)
            expect(user?.verified).toBe(false)
        })

        it('Fails if OTP has expired', async () => {
            const mockUser = createMockUser({
                verified: false,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
                updated: dayjs().subtract(31, 'minutes').toISOString(),
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.status).toBe(UserStatus.ACTIVE)
            expect(user?.verified).toBe(false)
        })

        it('Fails if OTP was confirmed before', async () => {
            const mockUser = createMockUser({
                verified: false,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
                state: OtpState.CONFIRMED,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockVerifyEmailRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.verified).toBe(false)
        })
    })

    describe('Reset Password Endpoint', () => {
        it('Updates user password', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.PASSWORD_RESET,
                state: OtpState.PENDING,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockResetPasswordRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.password).not.toBe(mockUser.password)
        })

        it('Fails if OTP is wrong', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.PASSWORD_RESET,
                value: correctOtp,
            })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const incorrectOtp = '654321'
            const mockResetPasswordRequest = {
                userId: mockUser.id,
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

            const user = await databaseConnection()
                .getRepository('user')
                .findOneBy({ id: mockUser.id })
            expect(user?.password).toBe(mockUser.password)
        })
    })
})
