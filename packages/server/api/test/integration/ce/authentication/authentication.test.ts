import { UserIdentityProvider } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../../../src/app/authentication/user-identity/user-identity-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import {
    createMockSignInRequest,
    createMockSignUpRequest,
} from '../../../helpers/mocks/authn'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

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
        it('Signs the new member in with a platform of their own', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest({ email: 'ahmad.tash@activepieces.com' })

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
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.platformId).not.toBeNull()
            expect(responseBody?.projectId).not.toBeNull()
            expect(responseBody?.token).toBeDefined()
        })

        it('Creates the platform and project from the name given at sign up', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest({ email: 'ahmad.tash@activepieces.com' })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const platform = await databaseConnection().getRepository('platform').findOneBy({ id: response?.json()?.platformId })
            expect(platform?.name).toBe('Activepieces')

            const platformCount = await databaseConnection().getRepository('platform').count()
            const projectCount = await databaseConnection().getRepository('project').count()

            expect(platformCount).toBe(1)
            expect(projectCount).toBe(1)
        })
    })

    describe('Sign in Endpoint', () => {
        it('Signs in to the platform created at sign up', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            const signUpResponse = await app?.inject({
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
            expect(responseBody?.platformId).toBe(signUpResponse?.json()?.platformId)
            expect(responseBody?.projectId).toBe(signUpResponse?.json()?.projectId)
            expect(await databaseConnection().getRepository('platform').count()).toBe(1)
        })

        it('Creates the platform for a member who verified their email before signing in', async () => {
            // arrange
            const password = 'password-that-verifies'
            await userIdentityService(app!.log).create({
                email: 'ahmad.tash@activepieces.com',
                password,
                firstName: 'Ahmad',
                lastName: 'Tash',
                trackEvents: false,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: true,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({ email: 'ahmad.tash@activepieces.com', password }),
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).not.toBeNull()
            expect(responseBody?.projectId).not.toBeNull()
            expect(responseBody?.firstName).toBe('Ahmad')
            expect(responseBody?.lastName).toBe('Tash')
        })

        it('Hands a pre-platform session to a member whose name was only guessed from their address', async () => {
            // arrange
            const password = 'password-that-verifies'
            await userIdentityService(app!.log).create({
                email: 'ahmad.tash@activepieces.com',
                password,
                firstName: 'Ahmad',
                lastName: '',
                trackEvents: false,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: true,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({ email: 'ahmad.tash@activepieces.com', password }),
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBeNull()
            expect(responseBody?.projectId).toBeNull()
            expect(await databaseConnection().getRepository('platform').count()).toBe(0)
        })

        it('Tells an identity with no user on the resolved platform why it cannot sign in', async () => {
            // arrange
            await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: createMockSignUpRequest({ email: 'ahmad.tash@activepieces.com' }),
            })

            const password = 'password-that-verifies'
            await userIdentityService(app!.log).create({
                email: 'orphan.identity@activepieces.com',
                password,
                firstName: 'Orphan',
                lastName: 'Identity',
                trackEvents: false,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: true,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: createMockSignInRequest({ email: 'orphan.identity@activepieces.com', password }),
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()?.code).toBe('USER_NOT_FOUND_ON_PLATFORM')
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
