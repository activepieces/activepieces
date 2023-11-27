import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockSignInRequest, createMockSignUpRequest } from '../../../helpers/mocks/authn'
import { createMockCustomDomain, createMockPlatform, createMockProject, createMockUser } from '../../../helpers/mocks'
import { ApFlagId, ProjectType, UserStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'
import { decodeToken } from '../../../helpers/auth'
import { OtpType } from '@activepieces/ee-shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    emailService.sendVerifyEmail = jest.fn()
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
            expect(responseBody?.status).toBe('CREATED')
            expect(responseBody?.platformId).toBe(null)
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })

        it('Sends a verification email', async () => {
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

            expect(emailService.sendVerifyEmail).toBeCalledTimes(1)
            expect(emailService.sendVerifyEmail).toHaveBeenCalledWith({
                email: responseBody?.email,
                otp: expect.stringMatching(/^\d{6}$/),
                platformId: null,
                type: OtpType.EMAIL_VERIFICATION,
                userId: responseBody?.id,
            })
        })

        it('Allows invited users to continue platform sign up', async () => {
            // arrange
            const mockPlatformId = faker.string.nanoid(21)

            const mockPlatformOwner = createMockUser({ platformId: mockPlatformId })
            const mockInvitedUser = createMockUser({ platformId: mockPlatformId, status: UserStatus.INVITED })
            await databaseConnection.getRepository('user').save([mockPlatformOwner, mockInvitedUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockPlatformOwner.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('custom_domain').save(mockCustomDomain)

            const mockSignUpRequest = createMockSignUpRequest({ email: mockInvitedUser.email })

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
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.status).toBe('VERIFIED')
        })

        it('Adds tasks for referrals', async () => {
            // arrange
            const mockReferringUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockReferringUser)

            const mockProject = createMockProject({ ownerId: mockReferringUser.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockSignUpRequest = createMockSignUpRequest({ referringUserId: mockReferringUser.id })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            const referral = await databaseConnection.getRepository('referal').findOneBy({
                referredUserId: responseBody?.id,
            })
            expect(referral?.referringUserId).toBe(mockReferringUser.id)

            const referringUserPlan = await databaseConnection.getRepository('project_plan').findOneBy({
                projectId: mockProject.id,
            })
            expect(referringUserPlan?.tasks).toBe(1500)

            const referredUserPlan = await databaseConnection.getRepository('project_plan').findOneBy({
                projectId: responseBody?.projectId,
            })
            expect(referredUserPlan?.tasks).toBe(1500)
        })

        it('Fails if USER_CREATED flag is set, and sign-up is disabled', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            await databaseConnection.getRepository('flag').save({
                id: ApFlagId.USER_CREATED,
                value: true,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Creates new project for user', async () => {
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

            const project = await databaseConnection.getRepository('project').findOneBy({
                id: responseBody.projectId,
            })

            expect(project?.ownerId).toBe(responseBody.id)
            expect(project?.displayName).toBe(`${responseBody.firstName}'s Project`)
            expect(project?.type).toBe(ProjectType.STANDALONE)
            expect(project?.platformId).toBeNull()
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

    describe('Sign in Endpoint', () => {
        it('Logs in existing users', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                status: UserStatus.VERIFIED,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(Object.keys(responseBody)).toHaveLength(15)
            expect(responseBody?.id).toBe(mockUser.id)
            expect(responseBody?.email).toBe(mockEmail)
            expect(responseBody?.firstName).toBe(mockUser.firstName)
            expect(responseBody?.lastName).toBe(mockUser.lastName)
            expect(responseBody?.trackEvents).toBe(mockUser.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockUser.newsLetter)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe(mockUser.status)
            expect(responseBody?.platformId).toBe(null)
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.token).toBeDefined()
        })

        it('Signs in platform users', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'
            const mockPlatformId = faker.string.nanoid()
            const mockPlatformDomain = faker.internet.domainName()

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                status: UserStatus.VERIFIED,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({ platformId: mockPlatformId, domain: mockPlatformDomain })
            await databaseConnection.getRepository('custom_domain').save(mockCustomDomain)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                headers: {
                    Host: mockPlatformDomain,
                },
                body: mockSignInRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody?.platformId).toBe(mockPlatformId)

            const decodedToken = decodeToken(responseBody?.token)
            expect(decodedToken?.platform?.id).toBe(mockPlatformId)
            expect(decodedToken?.platform?.role).toBe('OWNER')
        })

        it('Fails if password doesn\'t match', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                status: UserStatus.VERIFIED,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: 'wrong password',
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_CREDENTIALS')
        })

        it('Disallows invited users to login', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                status: UserStatus.INVITED,
            })
            await databaseConnection.getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_CREDENTIALS')
        })


    })
})
