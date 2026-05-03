import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ApEdition,
    DefaultProjectRole,

    InvitationStatus,
    InvitationType,
    OtpType,
    PlatformRole,
    Principal,
    PrincipalType,
    Project,
    ProjectRole,
    ProjectType,
    UserStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { Mock } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as emailServiceFile from '../../../../src/app/ee/helper/email/email-service'
import { system } from '../../../../src/app/helper/system/system'
import { db } from '../../../helpers/db'
import { decodeToken } from '../../../helpers/auth'
import {
    CLOUD_PLATFORM_ID,
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
import { jwtUtils } from 'packages/server/api/src/app/helper/jwt-utils'

let app: FastifyInstance | null = null

let sendOtpSpy: Mock

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    sendOtpSpy = vi.fn()
    vi.spyOn(emailServiceFile, 'emailService').mockImplementation((_log: FastifyBaseLogger) => ({
        sendOtp: sendOtpSpy,
        sendInvitation: vi.fn(),
        sendIssueCreatedNotification: vi.fn(),
        sendQuotaAlert: vi.fn(),
        sendTrialReminder: vi.fn(),
        sendReminderJobHandler: vi.fn(),
        sendExceedFailureThresholdAlert: vi.fn(),
        sendBadgeAwardedEmail: vi.fn(),
        sendProjectMemberAdded: vi.fn(),
    }))

    await databaseConnection().getRepository('flag').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_invitation').createQueryBuilder().delete().execute()
})
describe('Authentication API', () => {
    describe('Sign up Endpoint', () => {
        it('Create new user for the cloud user and then ask to verify email if email is not verified', async () => {
            const edition = system.getEdition()
            await mockAndSaveBasicSetup({
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
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            if (edition === ApEdition.CLOUD) {
                expect(responseBody).toEqual({
                    code: 'EMAIL_IS_NOT_VERIFIED',
                    params: {
                        email: mockSignUpRequest.email.toLocaleLowerCase().trim(),
                    },
                })
            }
            else {
                expect(responseBody?.code).toBe('INVITATION_ONLY_SIGN_UP')
            }
        })

        it('Sends a verification email', async () => {
            const edition = system.getEdition()
            // arrange
            const mockSignUpRequest = createMockSignUpRequest()
            await mockAndSaveBasicSetup({
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
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
                headers: {
                },
            })
            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            if (edition === ApEdition.CLOUD) {
                expect(responseBody).toEqual({
                    code: 'EMAIL_IS_NOT_VERIFIED',
                    params: {
                        email: mockSignUpRequest.email.toLocaleLowerCase().trim(),
                    },
                })

                expect(sendOtpSpy).toHaveBeenCalledTimes(1)
                expect(sendOtpSpy).toHaveBeenCalledWith({
                    otp: expect.stringMatching(/^([0-9A-F]|-){36}$/i),
                    platformId: null,
                    type: OtpType.EMAIL_VERIFICATION,
                    userIdentity: expect.objectContaining({
                        email: mockSignUpRequest.email.trim().toLocaleLowerCase(),
                    }),
                })
            }
            else {
                expect(responseBody?.code).toBe('INVITATION_ONLY_SIGN_UP')
            }
        })

        it('auto verify invited users to continue platform sign up', async () => {
            const {
                mockOwner: mockPlatformOwner,
                mockPlatform,
            } = await mockAndSaveBasicSetup({
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
            await db.save('project', mockProject)

            const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })

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

            await db.save('user_invitation', mockUserInvitation)


            const mockSignUpRequest = createMockSignUpRequest({
                email: mockedUpEmail,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const responseBody = response?.json()

            const projects = await databaseConnection().getRepository('project').find({ where: { ownerId: responseBody?.id } })
            expect(projects.length).toBe(1)
            expect(projects[0].type).toBe(ProjectType.PERSONAL)

            const teamProject = await databaseConnection().getRepository('project').findOne({ where: { displayName: mockProject.displayName } })
            expect(teamProject).toBeDefined()

            const projectMember = await databaseConnection().getRepository('project_member').findOne({ where: { projectId: teamProject?.id, userId: responseBody?.id } })

            expect(projectMember).toBeDefined()
            expect(projectMember?.userId).toBe(responseBody?.id)
            expect(projectMember?.projectId).toBe(teamProject?.id)
            expect(projectMember?.platformId).toBe(mockPlatform.id)
            expect(projectMember?.projectRoleId).toBe(editorRole.id)

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBeDefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
        })

        it('should join enterprise platform when signing up with accepted invitation on cloud (no custom domain)', async () => {
            // arrange - enterprise platform exists
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup({
                platform: { emailAuthEnabled: true },
                plan: { projectRolesEnabled: true, licenseKey: 'test-key' },
            })

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await db.save('project', mockProject)

            const invitedEmail = faker.internet.email()

            // ACCEPTED invitation (user clicked invite link)
            const mockUserInvitation = createMockUserInvitation({
                platformId: mockPlatform.id,
                email: invitedEmail,
                platformRole: PlatformRole.MEMBER,
                type: InvitationType.PLATFORM,
                status: InvitationStatus.ACCEPTED,
                created: dayjs().toISOString(),
            })
            await db.save('user_invitation', mockUserInvitation)

            const mockSignUpRequest = createMockSignUpRequest({ email: invitedEmail })

            // act - sign up without Host header
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            const responseBody = response?.json()

            // assert - user should be on enterprise platform
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBe(mockPlatform.id)

            // Invitation should be provisioned (deleted after processing)
            const remainingInvitation = await databaseConnection()
                .getRepository('user_invitation')
                .findOneBy({ id: mockUserInvitation.id })
            expect(remainingInvitation).toBeNull()

            // No personal platform is auto-created; only the enterprise platform exists
            const allPlatforms = await databaseConnection().getRepository('platform').find()
            expect(allPlatforms.length).toBe(1)
        })

        it('fails to sign up invited user platform if no project exist', async () => {
            // arrange — platform exists but has no projects, no invitation
            await mockAndSaveBasicSetup({
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
                url: '/api/v1/authentication/sign-up',
                body: mockSignUpRequest,
            })

            // assert — sign-up succeeds in onboarding mode (no platformId)
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('EMAIL_IS_NOT_VERIFIED')
        })

    })

    describe('Sign in Endpoint', () => {
        it('Logs in existing users', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
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
                url: '/api/v1/authentication/sign-in',
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

            await mockAndSaveBasicSetup({
                platform: {
                    id: mockPlatformId,
                    emailAuthEnabled: true,
                    enforceAllowedAuthDomains: false,
                },
                plan: {
                    ssoEnabled: false,
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
            await db.save('user', mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await db.save('project', mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: mockSignInRequest,
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.platformId).toBe(mockPlatformId)

            const decodedToken = decodeToken(responseBody?.token)
            expect(decodedToken?.platform?.id).toBe(mockPlatformId)
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
            await db.save('platform', mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await db.save('project', mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
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

        it('Onboarding response if user status is INACTIVE', async () => {
            // arrange
            const mockEmail = faker.internet.email()
            const mockPassword = 'password'

            const { mockUser } = await mockBasicUser({
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
            await db.save('platform', mockPlatform)

            const mockPlatformPlan = createMockPlatformPlan({
                platformId: mockPlatform.id,
                ssoEnabled: false,
            })
            await db.save('platform_plan', mockPlatformPlan)

            await db.update('user', mockUser.id, {
                platformId: mockPlatform.id,
            })

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await db.save('project', mockProject)

            const mockSignInRequest = createMockSignInRequest({
                email: mockEmail,
                password: mockPassword,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/sign-in',
                body: mockSignInRequest,
            })
            const responseBody = response?.json()

            // assert
            // In non-cloud editions, the sign-in fails with FORBIDDEN because the platform
            // is not found via Host header resolution. In cloud edition, it returns onboarding response for the user so he can create new platform.
            expect([StatusCodes.OK]).toContain(response?.statusCode)
            expect(responseBody?.token).toBeDefined()
            const decoded = jwtUtils.decode<Principal>({ jwt: responseBody?.token })
            expect(decoded.payload.type).toBe(PrincipalType.ONBOARDING)

        })

        it('Fails If the email auth is not enabled', async () => {
            // arrange

            const rawPassword = faker.internet.password()

            const { mockPlatform } = await mockAndSaveBasicSetup({
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
                url: '/api/v1/authentication/sign-in',
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

            await mockAndSaveBasicSetup({
                platform: {
                    id: mockPlatformId,
                    allowedAuthDomains: [mockPlatformDomain],
                    enforceAllowedAuthDomains: true,
                    emailAuthEnabled: true,
                },
                plan: {
                    ssoEnabled: true,
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
                url: '/api/v1/authentication/sign-in',
                headers: {
                    Host: mockPlatformDomain,
                },
                body: mockSignInRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('DOMAIN_NOT_ALLOWED')
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
            expect(responseBody?.id).toHaveLength(21)

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
})
