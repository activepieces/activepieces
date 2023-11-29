import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockSignUpRequest } from '../../../helpers/mocks/authn'
import { createMockCustomDomain, createMockPlatform, createMockUser } from '../../../helpers/mocks'
import { faker } from '@faker-js/faker'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    emailService.sendOtpEmail = jest.fn()
    stripeHelper.getOrCreateCustomer = jest.fn().mockResolvedValue(faker.string.alphanumeric())
    await databaseConnection.getRepository('flag').delete({})
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Authentication API', () => {
    describe('Sign up Endpoint', () => {
        it('Adds new user', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(15)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.email).toBe(mockSignUpRequest.email)
            expect(responseBody?.firstName).toBe(mockSignUpRequest.firstName)
            expect(responseBody?.lastName).toBe(mockSignUpRequest.lastName)
            expect(responseBody?.trackEvents).toBe(mockSignUpRequest.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockSignUpRequest.newsLetter)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('VERIFIED')
            expect(responseBody?.platformId).toBeDefined()
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })


        it('Disables platform sign ups for non invited users', async () => {
            // arrange
            const mockPlatformOwner = createMockUser()
            await databaseConnection.getRepository('user').save(mockPlatformOwner)

            const mockPlatform = createMockPlatform({ ownerId: mockPlatformOwner.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('custom_domain').save(mockCustomDomain)

            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                headers: {
                    Host: mockCustomDomain.domain,
                },
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('PLATFORM_SIGN_UP_ENABLED_FOR_INVITED_USERS_ONLY')
        })
    })

})
