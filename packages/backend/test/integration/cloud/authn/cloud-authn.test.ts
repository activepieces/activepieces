import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockSignInRequest, createMockSignUpRequest } from '../../../helpers/mocks/authn'
import { createMockCustomDomain, createMockPlatform, createMockProject, createMockUser, createProjectMember } from '../../../helpers/mocks'
import { ApFlagId, ProjectType, UserStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'
import { decodeToken } from '../../../helpers/auth'
import { OtpType, ProjectMemberRole, ProjectMemberStatus } from '@activepieces/ee-shared'

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

            expect(emailService.sendOtpEmail).toBeCalledTimes(1)
            expect(emailService.sendOtpEmail).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: null,
                type: OtpType.EMAIL_VERIFICATION,
                user: expect.objectContaining({
                    email: responseBody?.email,
                }),
            })
        })

        it('auto verify invited users to continue platform sign up', async () => {
            // arrange
            const mockPlatformId = faker.string.nanoid(21)

            const mockPlatformOwner = createMockUser({ platformId: mockPlatformId })
            await databaseConnection.getRepository('user').save([mockPlatformOwner])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockPlatformOwner.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockPlatformOwner.id, platformId: mockPlatformId })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockedUpEmail = faker.internet.email()
            const mockProjectMember = createProjectMember({
                projectId: mockProject.id,
                email: mockedUpEmail,
                platformId: mockPlatform.id,
                status: ProjectMemberStatus.ACTIVE,
                role: ProjectMemberRole.ADMIN,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)


            const mockCustomDomain = createMockCustomDomain({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('custom_domain').save(mockCustomDomain)

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
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.status).toBe('VERIFIED')
            expect(responseBody?.projectId).toBe(mockProject.id)
        })

        it('fails to sign up invited user platform if no project exist', async () => {
            // arrange
            const mockPlatformId = faker.string.nanoid(21)

            const mockPlatformOwner = createMockUser({ platformId: mockPlatformId })
            await databaseConnection.getRepository('user').save([mockPlatformOwner])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockPlatformOwner.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('custom_domain').save(mockCustomDomain)

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

            expect(responseBody?.code).toBe('INVITATIION_ONLY_SIGN_UP')
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

        it('Fails to sign in platform users if no project exists', async () => {
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
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityType).toBe('project')
            expect(responseBody?.params?.message).toBe(`no projects found for the user=${mockUser.id}`)
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
            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('INVALID_CREDENTIALS')
        })

        it('Fails if user status is SUSPENDED', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                status: UserStatus.SUSPENDED,
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
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('EMAIL_IS_NOT_VERIFIED')
            expect(responseBody?.params?.email).toBe(mockUser.email)
        })
    })
})
