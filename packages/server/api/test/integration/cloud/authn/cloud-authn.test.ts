import {
    CustomDomain,
    OtpType,
} from '@activepieces/ee-shared'
import {
    DefaultProjectRole,
    InvitationStatus,
    InvitationType,
    Platform,
    PlatformPlan,
    PlatformRole,
    Project,
    ProjectRole,
    User,
    UserStatus,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as emailServiceFile from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { decodeToken } from '../../../helpers/auth'
import {
    CLOUD_PLATFORM_ID,
    createMockCustomDomain,
    createMockPlatform,
    createMockPlatformPlan,
    createMockProject,
    createMockUserInvitation,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import {
    createMockSignInRequest,
    createMockSignUpRequest,
} from '../../../helpers/mocks/authn'

let app: FastifyInstance | null = null
let sendOtpSpy: jest.Mock

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(async () => {
    sendOtpSpy = jest.fn()
    jest.spyOn(emailServiceFile, 'emailService').mockImplementation((_log: FastifyBaseLogger) => ({
        sendOtp: sendOtpSpy,
        sendInvitation: jest.fn(),
        sendIssueCreatedNotification: jest.fn(),
        sendQuotaAlert: jest.fn(),
        sendReminderJobHandler: jest.fn(),
        sendTrialReminder: jest.fn(),
        sendExceedFailureThresholdAlert: jest.fn(),
    }))

    await databaseConnection().getRepository('flag').delete({})
    await databaseConnection().getRepository('project').delete({})
    await databaseConnection().getRepository('platform').delete({})
    await databaseConnection().getRepository('user').delete({})
    await databaseConnection().getRepository('user_identity').delete({})
    await databaseConnection().getRepository('custom_domain').delete({})
    await databaseConnection().getRepository('user_invitation').delete({})
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
                await createMockPlatformAndDomain({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                        emailAuthEnabled: true,
                    },
                    plan: {
                        ssoEnabled: false,
                    },
                })
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
            const { mockCustomDomain } =
                await createMockPlatformAndDomain({
                    platform: {
                        emailAuthEnabled: true,
                        enforceAllowedAuthDomains: true,

                        allowedAuthDomains: [],

                    },
                    plan: {
                        ssoEnabled: true,
                    },
                })
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
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('DOMAIN_NOT_ALLOWED')
        })

        it('Create new user for the cloud user and then ask to verify email if email is not verified', async () => {
            await createMockPlatformAndDomain({
                platform: {
                    id: CLOUD_PLATFORM_ID,
                    emailAuthEnabled: true,
                },
                plan: {
                    ssoEnabled: false,
                },
            })
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(responseBody).toEqual({
                code: 'EMAIL_IS_NOT_VERIFIED',
                params: {
                    email: mockSignUpRequest.email.toLocaleLowerCase().trim(),
                },
            })
        })

        it('Sends a verification email', async () => {
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            await createMockPlatformAndDomain({
                platform: {
                    id: CLOUD_PLATFORM_ID,
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    ssoEnabled: false,
                },
            })


            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                },
            })
            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(responseBody).toEqual({
                code: 'EMAIL_IS_NOT_VERIFIED',
                params: {
                    email: mockSignUpRequest.email.toLocaleLowerCase().trim(),
                },
            })

            expect(sendOtpSpy).toHaveBeenCalledTimes(1)
            expect(sendOtpSpy).toHaveBeenCalledWith({
                otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                platformId: expect.any(String),
                type: OtpType.EMAIL_VERIFICATION,
                userIdentity: expect.objectContaining({
                    email: mockSignUpRequest.email.trim().toLocaleLowerCase(),
                }),
            })
        })

        it('auto verify invited users to continue platform sign up', async () => {
            const {
                mockUser: mockPlatformOwner,
                mockPlatform,
                mockCustomDomain,
            } = await createMockPlatformAndDomain({
                platform: {
                },
                plan: {
                    ssoEnabled: false,
                    projectRolesEnabled: true,
                },
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
            expect(responseBody?.platformId).toBeDefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.projectId).toBe(mockProject.id)
        })

        it('fails to sign up invited user platform if no project exist', async () => {
            // arrange
            const { mockCustomDomain } = await createMockPlatformAndDomain({
                platform: {
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    ssoEnabled: false,
                },
            })
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

    })

    describe('Sign in Endpoint', () => {
        it('Fails If the email auth is not enabled', async () => {
            // arrange

            const rawPassword = faker.internet.password()

            const { mockPlatform, mockCustomDomain } = await createMockPlatformAndDomain({
                platform: {
                    emailAuthEnabled: false,
                },
                plan: {
                    ssoEnabled: true,
                },
            })

            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
                userIdentity: {
                    email: faker.internet.email(),
                    password: rawPassword,
                    verified: true,
                },
            })



            const mockSignInRequest = createMockSignInRequest({
                email: mockUserIdentity.email,
                password: rawPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                headers: {
                    Host: mockCustomDomain.domain,
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

            await createMockPlatformAndDomain({
                platform: {
                    id: mockPlatformId,
                    allowedAuthDomains: [mockPlatformDomain],
                    enforceAllowedAuthDomains: true,
                    emailAuthEnabled: true,
                },
                plan: {
                    ssoEnabled: true,
                },
                domain: {
                    domain: mockPlatformDomain,
                },
            })
            const rawPassword = faker.internet.password()
            const { mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                    platformId: mockPlatformId,
                    platformRole: PlatformRole.ADMIN,
                },
                userIdentity: {
                    email: faker.internet.email(),
                    password: rawPassword,
                    verified: true,
                },
            })


            const mockSignInRequest = createMockSignInRequest({
                email: mockUserIdentity.email,
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
            const { mockPlatform, mockProject } = await createMockPlatformAndDomain({
                platform: {
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    embeddingEnabled: false,
                    ssoEnabled: false,
                },
            })
            const { mockUser, mockUserIdentity } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    status: UserStatus.ACTIVE,
                    platformRole: PlatformRole.ADMIN,
                },
                userIdentity: {
                    email: mockEmail,
                    password: mockPassword,
                    verified: true,
                },
            })



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
            expect(responseBody?.email.toLocaleLowerCase().trim()).toBe(mockEmail.toLocaleLowerCase().trim())
            expect(responseBody?.firstName).toBe(mockUserIdentity.firstName)
            expect(responseBody?.lastName).toBe(mockUserIdentity.lastName)
            expect(responseBody?.trackEvents).toBe(mockUserIdentity.trackEvents)
            expect(responseBody?.newsLetter).toBe(mockUserIdentity.newsLetter)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe(mockUser.status)
            expect(responseBody?.verified).toBe(mockUserIdentity.verified)
            expect(responseBody?.platformId).toBe(mockPlatform.id)
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

            await createMockPlatformAndDomain({
                platform: {
                    id: mockPlatformId,
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    ssoEnabled: false,
                },
                domain: {
                    domain: mockPlatformDomain,
                    platformId: mockPlatformId,
                },
            })

            const { mockUser } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                    platformId: mockPlatformId,
                    platformRole: PlatformRole.ADMIN,
                },
                userIdentity: {
                    email: mockEmail,
                    password: mockPassword,
                    verified: true,
                },
            })
            await databaseConnection().getRepository('user').save(mockUser)

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

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBe(mockPlatformId)

            const decodedToken = decodeToken(responseBody?.token)
            expect(decodedToken?.platform?.id).toBe(mockPlatformId)
        })

        it('Fails to sign in platform users if no project exists', async () => {
            // arrange


            const { mockPlatform, mockCustomDomain } = await createMockPlatformAndDomain({
                platform: {
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    ssoEnabled: true,
                },
            })
            const mockPassword = 'password'
            const mockUserIdentityEmail = faker.internet.email()
            await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
                userIdentity: {
                    email: mockUserIdentityEmail,
                    password: mockPassword,
                    verified: true,
                },
            })


            const mockSignInRequest = createMockSignInRequest({
                email: mockUserIdentityEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/sign-in',
                headers: {
                    Host: mockCustomDomain.domain,
                },
                body: mockSignInRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            expect(responseBody?.code).toBe('INVITATION_ONLY_SIGN_UP')
        })

        it('Fails if password doesn\'t match', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const { mockUser } = await mockBasicUser({
                user: {
                    status: UserStatus.ACTIVE,
                },
                userIdentity: {
                    email: mockEmail,
                    password: mockPassword,
                    verified: true,
                },
            })

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

            const { mockUser, mockUserIdentity } = await mockBasicUser({
                user: {
                    status: UserStatus.INACTIVE,
                    platformRole: PlatformRole.ADMIN,
                },
                userIdentity: {
                    email: mockEmail,
                    password: mockPassword,
                    verified: true,
                },
            })

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                emailAuthEnabled: true,
                enforceAllowedAuthDomains: false,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockPlatformPlan = createMockPlatformPlan({
                platformId: mockPlatform.id,
                ssoEnabled: false,
            })
            await databaseConnection().getRepository('platform_plan').save(mockPlatformPlan)

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

            const responseBody = response?.json()
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            expect(responseBody?.code).toBe('USER_IS_INACTIVE')
            expect(responseBody?.params?.email).toBe(mockUserIdentity.email)
        })

    })
})

async function createMockPlatformAndDomain({ platform, domain, plan }: { platform: Partial<Platform>, domain?: Partial<CustomDomain>, plan?: Partial<PlatformPlan> }): Promise<{
    mockUser: User
    mockPlatform: Platform
    mockCustomDomain: CustomDomain
    mockProject: Project
}> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        platform,
    })
    const mockCustomDomain = createMockCustomDomain({
        platformId: mockPlatform.id,
        ...domain,
    })
    await databaseConnection()
        .getRepository('custom_domain')
        .save(mockCustomDomain)
    const mockPlatformPlan = createMockPlatformPlan({
        platformId: mockPlatform.id,
        ...plan,
    })
    await databaseConnection().getRepository('platform_plan').upsert(mockPlatformPlan, ['platformId'])
    return { mockUser: mockOwner, mockPlatform, mockCustomDomain, mockProject }
}