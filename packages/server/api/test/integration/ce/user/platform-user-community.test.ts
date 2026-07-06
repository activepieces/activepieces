import { apId } from '@activepieces/core-utils'
import { PlatformRole, PrincipalType, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import {
    mockAndSaveBasicSetup,
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
describe('User API', () => {
    describe('List users endpoint', () => {
        it('Returns a list of users', async () => {
            // arrange
            const { mockPlatform: mockPlatformOne, mockOwner: mockOwnerOne } = await mockAndSaveBasicSetup()

            // Create Another setup
            await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                id: mockOwnerOne.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatformOne.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                query: {},
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(3)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOwnerOne.id)
            expect(responseBody.data[0].password).toBeUndefined()
        })

        it('Requires principal to be platform owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()


            const { mockUser: normalUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })
            const testToken = await generateMockToken({
                id: normalUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/users',
                query: {},
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('AUTHORIZATION')
        })
    })

    describe('Update user endpoint', () => {
        it('Updates user status to be INACTIVE', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    status: UserStatus.ACTIVE,
                },
            })
            const testToken = await generateMockToken({
                id: mockOwner.id,
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
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseJson = response?.json()
            expect(responseJson.id).toBe(mockUser.id)
            expect(responseJson.password).toBeUndefined()
            expect(responseJson.status).toBe(UserStatus.INACTIVE)
        })

        it('Fails if user doesn\'t exist', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            // arrange
            const nonExistentUserId = apId()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${nonExistentUserId}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('Requires principal to be platform owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
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
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it('Allows invited admin to update a member', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            const { mockUser: mockMember } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    status: UserStatus.ACTIVE,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockMember.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().status).toBe(UserStatus.INACTIVE)
        })

        it('Fails if invited admin tries to update the platform owner', async () => {
            // arrange
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockOwner.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Fails if invited admin tries to update another admin', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin1 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            const { mockUser: mockAdmin2 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin1.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockAdmin2.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Fails if invited admin tries to update themselves', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/users/${mockAdmin.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response?.json().code).toBe('VALIDATION')
        })
    })

    describe('Delete user endpoint', () =>>,StartLine:200,TargetContent: {
        it('Removes a user', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockEditor } = await mockBasicUser({
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
                url: `/api/v1/users/${mockEditor.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

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
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it('Allows invited admin to delete a member', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            const { mockUser: mockMember } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockMember.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Fails if invited admin tries to delete the platform owner', async () => {
            // arrange
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockOwner.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Fails if invited admin tries to delete another admin', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin1 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            const { mockUser: mockAdmin2 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin1.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockAdmin2.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json().code).toBe('AUTHORIZATION')
        })

        it('Fails if invited admin tries to delete themselves', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: mockAdmin } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.ADMIN,
                },
            })

            const testToken = await generateMockToken({
                id: mockAdmin.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/users/${mockAdmin.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response?.json().code).toBe('VALIDATION')
        })
    })
})
