import { OtpType } from '@activepieces/ee-shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { CLOUD_PLATFORM_ID, createMockPlatform, createMockUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(() => {
    emailService.sendOtp = jest.fn()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('OTP API', () => {
    describe('Create and Send Endpoint', () => {
        it('Generates new OTP', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ id: CLOUD_PLATFORM_ID, ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, { platformId: mockPlatform.id })

            const mockCreateOtpRequest = {
                email: mockUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/otp',
                body: mockCreateOtpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Sends OTP to user', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ id: CLOUD_PLATFORM_ID, ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, { platformId: mockPlatform.id })
            
            const mockCreateOtpRequest = {
                email: mockUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/otp',
                body: mockCreateOtpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(emailService.sendOtp).toBeCalledTimes(1)
            expect(emailService.sendOtp).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: CLOUD_PLATFORM_ID,
                type: OtpType.EMAIL_VERIFICATION,
                user: expect.objectContaining({
                    email: mockUser.email,
                }),
            })
        })

        it('OTP is unique per user per OTP type', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ id: CLOUD_PLATFORM_ID, ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, { platformId: mockPlatform.id })

            const mockCreateOtpRequest = {
                email: mockUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            }

            // act
            const response1 = await app?.inject({
                method: 'POST',
                url: '/v1/otp',
                body: mockCreateOtpRequest,
            })

            const response2 = await app?.inject({
                method: 'POST',
                url: '/v1/otp',
                body: mockCreateOtpRequest,
            })

            // assert
            expect(response1?.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(response2?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const otpCount = await databaseConnection().getRepository('otp').countBy({
                userId: mockUser.id,
                type: mockCreateOtpRequest.type,
            })

            expect(otpCount).toBe(1)
        })
    })
})
