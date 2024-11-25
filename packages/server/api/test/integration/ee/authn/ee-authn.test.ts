import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import {
    createMockCustomDomain,
    createMockPlatform,
    createMockUser,
} from '../../../../test/helpers/mocks'
import { createMockSignUpRequest } from '../../../helpers/mocks/authn'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(async () => {
    emailService.sendOtp = jest.fn()
    stripeHelper.getOrCreateCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.alphanumeric())
    await databaseConnection().getRepository('flag').delete({})
})

afterAll(async () => {
    await databaseConnection().destroy()
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

            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.email).toBe(mockSignUpRequest.email.toLocaleLowerCase().trim())
            expect(responseBody?.firstName).toBe(mockSignUpRequest.firstName)
            expect(responseBody?.lastName).toBe(mockSignUpRequest.lastName)
            expect(responseBody?.trackEvents).toBe(mockSignUpRequest.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockSignUpRequest.newsLetter)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.platformId).toBeDefined()
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })
    })

    it('fails to sign up invited user platform if no project exist', async () => {
    // arrange
        const mockPlatformId = faker.string.nanoid(21)

        const mockPlatformOwner = createMockUser({ platformId: mockPlatformId })
        await databaseConnection().getRepository('user').save([mockPlatformOwner])

        const mockPlatform = createMockPlatform({
            id: mockPlatformId,
            ownerId: mockPlatformOwner.id,
        })
        await databaseConnection().getRepository('platform').save(mockPlatform)

        const mockCustomDomain = createMockCustomDomain({
            platformId: mockPlatform.id,
        })
        await databaseConnection()
            .getRepository('custom_domain')
            .save(mockCustomDomain)

        const mockedUpEmail = faker.internet.email()
        const mockSignUpRequest = createMockSignUpRequest({ email: mockedUpEmail })

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

        expect(responseBody?.code).toBe('INVITATION_ONLY_SIGN_UP')
    })
})
