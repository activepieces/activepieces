import { OtpType } from '@activepieces/ee-shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as emailServiceFile from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let sendOtpSpy: jest.Mock

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(() => {
    sendOtpSpy = jest.fn()
    jest.spyOn(emailServiceFile, 'emailService').mockImplementation((_log: FastifyBaseLogger) => ({
        sendOtp: sendOtpSpy,
        sendInvitation: jest.fn(),
        sendIssueCreatedNotification: jest.fn(),
        sendQuotaAlert: jest.fn(),
        sendReminderJobHandler: jest.fn(),
        sendTrialReminder: jest.fn(),
        sendOneDayLeftOnTrial: jest.fn(),
        sendWellcomeToTrialEmail: jest.fn(),
        sendSevenDaysInTrialEmail: jest.fn(),
        sendExceedFailureThresholdAlert: jest.fn(),
    }))

})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('OTP API', () => {
    describe('Create and Send Endpoint', () => {
        it('Generates new OTP', async () => {
            const { mockUserIdentity } = await mockAndSaveBasicSetup()

            const mockCreateOtpRequest = {
                email: mockUserIdentity.email,
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
            const { mockUserIdentity } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user_identity').update(mockUserIdentity.id, {
                verified: false,
            })

            const mockCreateOtpRequest = {
                email: mockUserIdentity.email,
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
            expect(sendOtpSpy).toHaveBeenCalledTimes(1)
            expect(sendOtpSpy).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: null,
                type: OtpType.EMAIL_VERIFICATION,
                userIdentity: expect.objectContaining({
                    email: mockUserIdentity.email,
                }),
            })
        })

        it('OTP is unique per user per OTP type', async () => {
            const { mockUserIdentity } = await mockAndSaveBasicSetup()

            const mockCreateOtpRequest = {
                email: mockUserIdentity.email,
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
                identityId: mockUserIdentity.id,
                type: mockCreateOtpRequest.type,
            })

            expect(otpCount).toBe(1)
        })
    })
})
