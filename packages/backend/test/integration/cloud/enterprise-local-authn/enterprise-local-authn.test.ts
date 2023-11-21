import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockOtp, createMockUser } from '../../../helpers/mocks'
import { generateMockToken } from '../../../helpers/auth'
import { OtpType } from '@activepieces/ee-shared'
import { UserStatus } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Enterprise Local Authn API', () => {
    describe('Verify Email Endpoint', () => {
        it('Verifies user', async () => {
            const mockUser = createMockUser({
                status: UserStatus.CREATED,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
            })
            await databaseConnection.getRepository('otp').save(mockOtp)

            const mockToken = await generateMockToken({ id: mockUser.id })

            const mockVerifyEmailRequest = {
                otp: mockOtp.value,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.body).toBe('')

            const user = await databaseConnection.getRepository('user').findOneBy({ id: mockUser.id })
            expect(user?.status).toBe(UserStatus.VERIFIED)
        })

        it('Fails if OTP is wrong', async () => {
            const mockUser = createMockUser({
                status: UserStatus.CREATED,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.EMAIL_VERIFICATION,
                value: correctOtp,
            })
            await databaseConnection.getRepository('otp').save(mockOtp)

            const mockToken = await generateMockToken({ id: mockUser.id })

            const incorrectOtp = '654321'
            const mockVerifyEmailRequest = {
                otp: incorrectOtp,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authn/local/verify-email',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockVerifyEmailRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const user = await databaseConnection.getRepository('user').findOneBy({ id: mockUser.id })
            expect(user?.status).toBe(UserStatus.CREATED)
        })
    })

    describe('Reset Password Endpoint', () => {
        it('Updates user password', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.PASSWORD_RESET,
            })
            await databaseConnection.getRepository('otp').save(mockOtp)

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

            const user = await databaseConnection.getRepository('user').findOneBy({ id: mockUser.id })
            expect(user?.password).not.toBe(mockUser.password)
        })

        it('Fails if OTP is wrong', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const correctOtp = '123456'
            const mockOtp = createMockOtp({
                userId: mockUser.id,
                type: OtpType.PASSWORD_RESET,
                value: correctOtp,
            })
            await databaseConnection.getRepository('otp').save(mockOtp)

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
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_OTP')

            const user = await databaseConnection.getRepository('user').findOneBy({ id: mockUser.id })
            expect(user?.password).toBe(mockUser.password)
        })
    })
})
