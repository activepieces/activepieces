import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import {
    createMockSignInRequest,
    createMockSignUpRequest,
} from '../../../helpers/mocks/authn'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('flag').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
})
describe('Authentication API', () => {
    describe('Sign up Endpoint', () => {
        it('Adds new user with onboarding token', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.email).toBe(mockSignUpRequest.email.toLocaleLowerCase().trim())
            expect(responseBody?.firstName).toBe(mockSignUpRequest.firstName)
            expect(responseBody?.lastName).toBe(mockSignUpRequest.lastName)
            expect(responseBody?.trackEvents).toBe(mockSignUpRequest.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockSignUpRequest.newsLetter)
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.platformId).toBeNull()
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toBeNull()
            expect(responseBody?.token).toBeDefined()
        })

        it('Does not create project or platform on signup', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const platformCount = await databaseConnection().getRepository('platform').count()
            const projectCount = await databaseConnection().getRepository('project').count()

            expect(platformCount).toBe(0)
            expect(projectCount).toBe(0)
        })
    })

    describe('Create Platform Endpoint', () => {
        it('Creates platform and project with onboarding token', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            const signUpResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })
            const signUpBody = signUpResponse?.json()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/platforms',
                headers: {
                    authorization: `Bearer ${signUpBody.token}`,
                },
                body: {
                    name: 'My Platform',
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toHaveLength(21)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
            expect(responseBody?.id).toBe(signUpBody.id)

            const platformCount = await databaseConnection().getRepository('platform').count()
            const projectCount = await databaseConnection().getRepository('project').count()

            expect(platformCount).toBe(1)
            expect(projectCount).toBe(1)
        })

        it('Fails with missing name', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            const signUpResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })
            const signUpBody = signUpResponse?.json()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/platforms',
                headers: {
                    authorization: `Bearer ${signUpBody.token}`,
                },
                body: {},
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })

    describe('Sign in Endpoint', () => {
        it('Logs in with onboarding token when no platform exists', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const mockSignInRequest = createMockSignInRequest({
                email: mockSignUpRequest.email,
                password: mockSignUpRequest.password,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBeNull()
            expect(responseBody?.projectId).toBeNull()
            expect(responseBody?.token).toBeDefined()
        })

        it('Logs in with user token after platform creation', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            const signUpResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })
            const signUpBody = signUpResponse?.json()

            const createPlatformResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/platforms',
                headers: {
                    authorization: `Bearer ${signUpBody.token}`,
                },
                body: {
                    name: 'My Platform',
                },
            })
            const createPlatformBody = createPlatformResponse?.json()

            const mockSignInRequest = createMockSignInRequest({
                email: mockSignUpRequest.email,
                password: mockSignUpRequest.password,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.email).toBe(mockSignUpRequest.email.toLowerCase().trim())
            expect(responseBody?.firstName).toBe(mockSignUpRequest.firstName)
            expect(responseBody?.lastName).toBe(mockSignUpRequest.lastName)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.platformId).toBe(createPlatformBody.platformId)
            expect(responseBody?.projectId).toBe(createPlatformBody.projectId)
            expect(responseBody?.token).toBeDefined()
        })

        it('Fails if password doesn\'t match', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // First sign up the user
            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const mockSignInRequest = createMockSignInRequest({
                email: mockSignUpRequest.email,
                password: 'wrong password',
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_CREDENTIALS')
        })
    })
})
