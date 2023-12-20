import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUser } from '../../../helpers/mocks'
import { OtpType } from '@activepieces/ee-shared'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(() => {
    emailService.sendOtpEmail = jest.fn()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('OTP API', () => {
    describe('Create and Send Endpoint', () => {
        it('Generates new OTP', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

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
            await databaseConnection.getRepository('user').save(mockUser)

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
            expect(emailService.sendOtpEmail).toBeCalledTimes(1)
            expect(emailService.sendOtpEmail).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: null,
                type: OtpType.EMAIL_VERIFICATION,
                user: expect.objectContaining({
                    email: mockUser.email,
                }),
            })
        })

        it('OTP is unique per user per OTP type', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

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

            const otpCount = await databaseConnection.getRepository('otp').countBy({
                userId: mockUser.id,
                type: mockCreateOtpRequest.type,
            })

            expect(otpCount).toBe(1)
        })
    })
})
