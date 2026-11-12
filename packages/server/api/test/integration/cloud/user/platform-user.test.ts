
import { Permission, RoleType } from '@activepieces/core-utils'
import { PlatformRole, PrincipalType, UpdateUserRequestBody, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockProjectMember,
    createMockProjectRole,
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

        it('Blocks an admin from changing the platform owner', async () => {
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN },
            })
            const token = await generateMockToken({ id: mockAdmin.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const roleResponse = await updateUser({ token, userId: mockOwner.id, body: { platformRole: PlatformRole.MEMBER } })
            const externalIdResponse = await updateUser({ token, userId: mockOwner.id, body: { externalId: 'changed' } })

            expect(roleResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(roleResponse?.json().code).toBe('AUTHORIZATION')
            expect(externalIdResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const owner = await databaseConnection().getRepository('user').findOneByOrFail({ id: mockOwner.id })
            expect(owner.platformRole).toBe(PlatformRole.ADMIN)
        })

        it('Blocks an api key from changing the platform owner', async () => {
            const { mockOwner, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const response = await updateUser({ token: mockApiKey.value, userId: mockOwner.id, body: { platformRole: PlatformRole.MEMBER } })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Blocks an admin from changing their own role or deactivating themselves', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN, status: UserStatus.ACTIVE },
            })
            const token = await generateMockToken({ id: mockAdmin.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const roleResponse = await updateUser({ token, userId: mockAdmin.id, body: { platformRole: PlatformRole.MEMBER } })
            const statusResponse = await updateUser({ token, userId: mockAdmin.id, body: { status: UserStatus.INACTIVE } })

            expect(roleResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(roleResponse?.json().code).toBe('AUTHORIZATION')
            expect(statusResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(statusResponse?.json().code).toBe('AUTHORIZATION')
            const admin = await databaseConnection().getRepository('user').findOneByOrFail({ id: mockAdmin.id })
            expect(admin.platformRole).toBe(PlatformRole.ADMIN)
            expect(admin.status).toBe(UserStatus.ACTIVE)
        })

        it('Blocks the platform owner from changing their own role', async () => {
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
            const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const response = await updateUser({ token, userId: mockOwner.id, body: { platformRole: PlatformRole.MEMBER } })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Allows the platform owner to change an admin', async () => {
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN, status: UserStatus.ACTIVE },
            })
            const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const response = await updateUser({ token, userId: mockAdmin.id, body: { platformRole: PlatformRole.MEMBER, status: UserStatus.INACTIVE } })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().platformRole).toBe(PlatformRole.MEMBER)
            expect(response?.json().status).toBe(UserStatus.INACTIVE)
        })

        it('Allows an admin to change a member', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN },
            })
            const { mockUser: mockMember } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            })
            const token = await generateMockToken({ id: mockAdmin.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const response = await updateUser({ token, userId: mockMember.id, body: { platformRole: PlatformRole.OPERATOR, status: UserStatus.INACTIVE } })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().platformRole).toBe(PlatformRole.OPERATOR)
            expect(response?.json().status).toBe(UserStatus.INACTIVE)
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

async function updateUser({ token, userId, body }: { token: string, userId: string, body: UpdateUserRequestBody }) {
    return app?.inject({
        method: 'POST',
        url: `/api/v1/users/${userId}`,
        headers: { authorization: `Bearer ${token}` },
        body,
    })
}
