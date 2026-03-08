import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import {
    createMockCustomDomain,
    mockAndSaveBasicSetup,
} from '../../../../test/helpers/mocks'
import { db } from '../../../helpers/db'
import { createMockSignUpRequest } from '../../../helpers/mocks/authn'


let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
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

    it('should fail signup on custom domain when no project exists', async () => {
    // arrange

        const { mockPlatform } = await mockAndSaveBasicSetup({
            platform: {
                emailAuthEnabled: true,
                enforceAllowedAuthDomains: false,
            },
            plan: {
                ssoEnabled: false,
            },
        })
        const mockCustomDomain = createMockCustomDomain({
            platformId: mockPlatform.id,
        })
        await db.save('custom_domain', mockCustomDomain)

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
