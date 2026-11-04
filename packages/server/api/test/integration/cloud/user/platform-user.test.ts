
import { Permission, RoleType } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, PlatformRole, PrincipalType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockProjectMember,
    createMockProjectRole,
    createMockUserInvitation,
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Enterprise User API', () => {
    describe('List users endpoint', () => {

        it('Allows service accounts', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                query: {
                    platformId: mockPlatform.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(3)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOwner.id)
        })

        it('Allows non-embed users with invite permission to list platform users', async () => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                userIdentity: {
                    provider: UserIdentityProvider.EMAIL,
                },
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const projectRole = createMockProjectRole({
                platformId: mockPlatform.id,
                type: RoleType.CUSTOM,
                permissions: [Permission.WRITE_INVITATION],
            })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const projectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save(projectMember)

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data.length).toBeGreaterThanOrEqual(1)
        })

        it('Rejects non-embed users without invite permission', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                userIdentity: {
                    provider: UserIdentityProvider.EMAIL,
                },
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Rejects embed users from listing platform users', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                userIdentity: {
                    provider: UserIdentityProvider.JWT,
                },
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Allows admin embed users to list platform users', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                userIdentity: {
                    provider: UserIdentityProvider.JWT,
                },
            })

            const mockOwnerToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

    })

    describe('List users with invitations endpoint', () => {
        async function setup() {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser: deactivatedUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, status: UserStatus.INACTIVE, created: '2026-01-02T00:00:00.000Z' },
            })
            const projectRole = createMockProjectRole({ platformId: mockPlatform.id, type: RoleType.CUSTOM, permissions: [Permission.READ_FLOW] })
            await databaseConnection().getRepository('project_role').save(projectRole)
            const invitation = (created: string, status: InvitationStatus) =>
                createMockUserInvitation({ platformId: mockPlatform.id, type: InvitationType.PLATFORM, status, platformRole: PlatformRole.MEMBER, created })
            const invitations = [
                invitation('2026-01-04T00:00:00.000Z', InvitationStatus.ACCEPTED),
                invitation('2026-01-03T00:00:00.000Z', InvitationStatus.PENDING),
                { ...invitation('2026-01-02T00:00:00.000Z', InvitationStatus.PENDING), projectId: mockProject.id, projectRoleId: projectRole.id },
                invitation('2026-01-01T00:00:00.000Z', InvitationStatus.PENDING),
            ]
            const projectInvitation = createMockUserInvitation({ platformId: mockPlatform.id, type: InvitationType.PROJECT, status: InvitationStatus.PENDING, projectId: mockProject.id })
            await databaseConnection().getRepository('user_invitation').save([...invitations, projectInvitation])
            const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
            return { mockOwner, mockPlatform, deactivatedUser, invitations, projectRole, token }
        }

        async function list(token: string, query: Record<string, string | string[]> = {}) {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users/with-invitations',
                query,
                headers: { authorization: `Bearer ${token}` },
            })
            return { status: response?.statusCode, body: response?.json() }
        }
        const ids = (page: { data: { id: string }[] }) => page.data.map((row) => row.id)

        it('Lists platform invitations newest first, then users, in full pages', async () => {
            const { mockOwner, deactivatedUser, invitations, projectRole, token } = await setup()

            const first = (await list(token, { limit: '3' })).body
            const second = (await list(token, { limit: '3', cursor: first.next })).body
            const pastEnd = (await list(token, { limit: '3', cursor: '1000' })).body

            expect(ids(first)).toEqual([invitations[0].id, invitations[1].id, invitations[2].id])
            expect(ids(second)).toEqual([invitations[3].id, mockOwner.id, deactivatedUser.id])
            expect(second.next).toBeNull()
            expect(first.data[2].data.projectRole.id).toBe(projectRole.id)
            expect(pastEnd).toEqual({ data: [], next: null, previous: '3' })
        })

        it('Filters by status across pages', async () => {
            const { deactivatedUser, invitations, token } = await setup()

            const page = (await list(token, { status: ['INVITED', 'INACTIVE'], limit: '3', cursor: '3' })).body

            expect(ids(page)).toEqual([invitations[3].id, deactivatedUser.id])
        })

        it('Never returns users or invitations from another platform', async () => {
            const { token } = await setup()
            const other = await setup()

            const page = (await list(token)).body
            const otherIds = [other.mockOwner.id, other.deactivatedUser.id, ...other.invitations.map((row) => row.id)]

            expect(page.data).toHaveLength(6)
            expect(page.data.some((row: { id: string }) => otherIds.includes(row.id))).toBe(false)
        })

        it('Rejects platform members and service accounts', async () => {
            const { mockPlatform } = await setup()
            const { mockUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            })
            const memberToken = await generateMockToken({ id: mockUser.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
            const { mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            expect((await list(memberToken)).status).toBe(StatusCodes.FORBIDDEN)
            expect((await list(mockApiKey.value)).status).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Update user endpoint', () => {

        it('Failed if own other platform', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockOwner: mockOwner2, mockPlatform: mockPlatform2 } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const mockUserToken = await generateMockToken({
                id: mockOwner2.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform2.id,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('Fail if not admin', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Allows service accounts to activate', async () => {
            // arrange
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.INACTIVE,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: {
                    status: UserStatus.ACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseJson = response?.json()
            expect(responseJson.id).toBe(mockUser.id)
            expect(responseJson.password).toBeUndefined()
            expect(responseJson.status).toBe(UserStatus.ACTIVE)
        })


    })

    describe('Delete user endpoint', () => {

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetupWithApiKey()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Allows platform owner to delete user', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetupWithApiKey()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockOwnerToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

    })
})
