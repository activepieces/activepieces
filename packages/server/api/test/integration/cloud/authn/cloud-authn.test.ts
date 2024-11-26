import {
    CustomDomain,
    OtpType,
} from '@activepieces/ee-shared'
import {
    apId,
    DefaultProjectRole,
    InvitationStatus,
    InvitationType,
    Platform,
    PlatformRole,
    ProjectRole,
    User,
    UserStatus,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { decodeToken } from '../../../helpers/auth'
import {
    CLOUD_PLATFORM_ID,
    createMockCustomDomain,
    createMockPlatform,
    createMockProject,
    createMockUser,
    createMockUserInvitation,
} from '../../../helpers/mocks'
import {
    createMockSignInRequest,
    createMockSignUpRequest,
} from '../../../helpers/mocks/authn'

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
    await databaseConnection().getRepository('project').delete({})
    await databaseConnection().getRepository('platform').delete({})
    await databaseConnection().getRepository('user').delete({})
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Authentication API', () => {
    describe('Sign up Endpoint', () => {
        it('Add new user if the domain is allowed', async () => {
            // arrange
            const { mockPlatform, mockUser, mockCustomDomain } =
                await createMockPlatformAndDomain()
            const mockSignUpRequest = createMockSignUpRequest()
            await databaseConnection()
                .getRepository('platform')
                .update(mockPlatform.id, {
                    enforceAllowedAuthDomains: true,
                    allowedAuthDomains: [mockSignUpRequest.email.split('@')[1]],
                })

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const mockUserInvitation = createMockUserInvitation({
                platformId: mockPlatform.id,
                email: mockSignUpRequest.email,
                platformRole: PlatformRole.ADMIN,
                type: InvitationType.PLATFORM,
                status: InvitationStatus.ACCEPTED,
                created: dayjs().toISOString(),
            })

            await databaseConnection()
                .getRepository('user_invitation')
                .save(mockUserInvitation)

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                    Host: mockCustomDomain.domain,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
        it('Fails If the domain is not allowed', async () => {
            // arrange
            const { mockPlatform, mockCustomDomain } =
                await createMockPlatformAndDomain()
            await databaseConnection()
                .getRepository('platform')
                .update(mockPlatform.id, {
                    enforceAllowedAuthDomains: true,
                    allowedAuthDomains: [],
                    ssoEnabled: true,
                })
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                    Host: mockCustomDomain.domain,
                },
            })
            // assert
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('DOMAIN_NOT_ALLOWED')
        })

        it('Adds new user', async () => {
            const { mockPlatform, mockCustomDomain } =
                await createMockPlatformAndDomain(CLOUD_PLATFORM_ID)
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                    Host: mockCustomDomain.domain,
                },
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
            expect(responseBody?.verified).toBe(false)
            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.externalId).toBe(null)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })

        it('Sends a verification email', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            const { mockCustomDomain, mockPlatform } =
                await createMockPlatformAndDomain(CLOUD_PLATFORM_ID)
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                    Host: mockCustomDomain.domain,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(emailService.sendOtp).toBeCalledTimes(1)
            expect(emailService.sendOtp).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: mockPlatform.id,
                type: OtpType.EMAIL_VERIFICATION,
                user: expect.objectContaining({
                    email: responseBody?.email,
                }),
            })
        })

        it('auto verify invited users to continue platform sign up', async () => {
            const {
                mockUser: mockPlatformOwner,
                mockPlatform,
                mockCustomDomain,
            } = await createMockPlatformAndDomain()

            await databaseConnection().getRepository('platform').update(mockPlatform.id, {
                projectRolesEnabled: true,
            })
            const mockProject = createMockProject({
                ownerId: mockPlatformOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const editorRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.EDITOR }) as ProjectRole
            
            const mockedUpEmail = faker.internet.email()
            const mockUserInvitation = createMockUserInvitation({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                email: mockedUpEmail,
                projectRole: editorRole,
                type: InvitationType.PROJECT,
                status: InvitationStatus.ACCEPTED,
                created: dayjs().toISOString(),
            })

            await databaseConnection()
                .getRepository('user_invitation')
                .save(mockUserInvitation)


            const mockSignUpRequest = createMockSignUpRequest({
                email: mockedUpEmail,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                headers: {
                    Host: mockCustomDomain.domain,
                },
                body: mockSignUpRequest,
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.projectId).toBe(mockProject.id)
        })

        it('fails to sign up invited user platform if no project exist', async () => {
            // arrange

            const { mockCustomDomain } = await createMockPlatformAndDomain()
            const mockedUpEmail = faker.internet.email()
            const mockSignUpRequest = createMockSignUpRequest({
                email: mockedUpEmail,
            })

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

        it('Adds tasks for referrals', async () => {
            // arrange
            const { mockCustomDomain, mockPlatform } =
                await createMockPlatformAndDomain(CLOUD_PLATFORM_ID)
            const mockReferringUser = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection().getRepository('user').save(mockReferringUser)

            const mockProject = createMockProject({
                ownerId: mockReferringUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const mockSignUpRequest = createMockSignUpRequest({
                referringUserId: mockReferringUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                    Host: mockCustomDomain.domain,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            const referral = await databaseConnection()
                .getRepository('referal')
                .findOneBy({
                    referredUserId: responseBody?.id,
                })
            expect(referral?.referringUserId).toBe(mockReferringUser.id)

            const referringUserPlan = await databaseConnection()
                .getRepository('project_plan')
                .findOneBy({
                    projectId: mockProject.id,
                })
            expect(referringUserPlan?.tasks).toBe(1500)

            const referredUserPlan = await databaseConnection()
                .getRepository('project_plan')
                .findOneBy({
                    projectId: responseBody?.projectId,
                })
            expect(referredUserPlan?.tasks).toBe(1500)
        })

        it('Creates new project for cloud user', async () => {
            const { mockPlatform, mockCustomDomain } =
                await createMockPlatformAndDomain(CLOUD_PLATFORM_ID)
            // arrange
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
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            const project = await databaseConnection()
                .getRepository('project')
                .findOneBy({
                    id: responseBody.projectId,
                })

            expect(project?.ownerId).toBe(responseBody.id)
            expect(project?.displayName).toBe(`${responseBody.firstName}'s Project`)
            expect(project?.platformId).toBe(mockPlatform.id)
        })
    })

    describe('Sign in Endpoint', () => {
        it('Fails If the email auth is not enabled', async () => {
            // arrange
            const mockPlatformId = faker.string.nanoid()
            const mockPlatformDomain = faker.internet.domainName()

            const rawPassword = faker.internet.password()
            const mockUser = createMockUser({
                email: faker.internet.email(),
                password: rawPassword,
                verified: true,
                status: UserStatus.ACTIVE,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: mockPlatformId,
                ownerId: mockUser.id,
                emailAuthEnabled: false,
                ssoEnabled: true,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({
                platformId: mockPlatformId,
                domain: mockPlatformDomain,
            })
            await databaseConnection()
                .getRepository('custom_domain')
                .save(mockCustomDomain)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockUser.email,
                password: rawPassword,
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
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('EMAIL_AUTH_DISABLED')
        })

        it('Fails If the domain is not allowed', async () => {
            // arrange
            const mockPlatformId = faker.string.nanoid()
            const mockPlatformDomain = faker.internet.domainName()

            const rawPassword = faker.internet.password()
            const mockUser = createMockUser({
                email: faker.internet.email(),
                password: rawPassword,
                verified: true,
                status: UserStatus.ACTIVE,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: mockPlatformId,
                ownerId: mockUser.id,
                allowedAuthDomains: [mockPlatformDomain],
                enforceAllowedAuthDomains: true,
                ssoEnabled: true,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({
                platformId: mockPlatformId,
                domain: mockPlatformDomain,
            })
            await databaseConnection()
                .getRepository('custom_domain')
                .save(mockCustomDomain)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockUser.email,
                password: rawPassword,
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
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('DOMAIN_NOT_ALLOWED')
        })

        it('Logs in existing users', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                verified: true,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)
            const mockPlatform = createMockPlatform({
                id: CLOUD_PLATFORM_ID,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
            })
            const mockProject = createMockProject({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

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
            expect(responseBody?.id).toBe(mockUser.id)
            expect(responseBody?.email).toBe(mockEmail)
            expect(responseBody?.firstName).toBe(mockUser.firstName)
            expect(responseBody?.lastName).toBe(mockUser.lastName)
            expect(responseBody?.trackEvents).toBe(mockUser.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockUser.newsLetter)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe(mockUser.status)
            expect(responseBody?.verified).toBe(mockUser.verified)
            expect(responseBody?.platformId).toBe(CLOUD_PLATFORM_ID)
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
                verified: true,
                status: UserStatus.ACTIVE,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: mockPlatformId,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockCustomDomain = createMockCustomDomain({
                platformId: mockPlatformId,
                domain: mockPlatformDomain,
            })
            await databaseConnection()
                .getRepository('custom_domain')
                .save(mockCustomDomain)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('project').save(mockProject)

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
                verified: true,
                status: UserStatus.ACTIVE,
                platformId: mockPlatformId,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: mockPlatformId,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
            })
            const mockCustomDomain = createMockCustomDomain({
                platformId: mockPlatformId,
                domain: mockPlatformDomain,
            })
            await databaseConnection()
                .getRepository('custom_domain')
                .save(mockCustomDomain)

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
            expect(responseBody?.params?.message).toBe(
                `no projects found for the user=${mockUser.id}`,
            )
        })

        it('Fails if password doesn\'t match', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                verified: true,
                status: UserStatus.ACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: CLOUD_PLATFORM_ID,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

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

        it('Fails if user status is INACTIVE', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const mockUser = createMockUser({
                email: mockEmail,
                password: mockPassword,
                verified: true,
                status: UserStatus.INACTIVE,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                id: CLOUD_PLATFORM_ID,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)
            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
            })

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(mockProject)

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

            expect(responseBody?.code).toBe('USER_IS_INACTIVE')
            expect(responseBody?.params?.email).toBe(mockUser.email)
        })
    })
})

async function createMockPlatformAndDomain(
    platformId?: string,
): Promise<{
        mockUser: User
        mockPlatform: Platform
        mockCustomDomain: CustomDomain
    }> {
    const mockUser = createMockUser()
    await databaseConnection().getRepository('user').save(mockUser)

    const mockPlatform = createMockPlatform({
        ownerId: mockUser.id,
        id: platformId ?? apId(),
    })
    await databaseConnection().getRepository('platform').save(mockPlatform)

    const mockCustomDomain = createMockCustomDomain({
        platformId: mockPlatform.id,
    })
    await databaseConnection()
        .getRepository('custom_domain')
        .save(mockCustomDomain)
    return { mockUser, mockPlatform, mockCustomDomain }
}
