import {
    apId,
    PlatformRole,
    PrincipalType,
    UserStatus,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPlatform,
    createMockPlatformWithOwner,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer() 
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Enterprise User API', () => {
    describe('List users endpoint', () => {
        it('Returns a list of users', async () => {
            // arrange
            const { mockOwner: mockOwnerOne, mockPlatform: mockPlatformOne } =
        createMockPlatformWithOwner()
            const { mockOwner: mockOwnerTwo, mockPlatform: mockPlatformTwo } =
        createMockPlatformWithOwner()

            await databaseConnection()
                .getRepository('user')
                .save([mockOwnerOne, mockOwnerTwo])
            await databaseConnection()
                .getRepository('platform')
                .save([mockPlatformOne, mockPlatformTwo])

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
                url: '/v1/users',
                query: {
                    platformId: mockPlatformOne.id,
                },
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

            const { mockPlatform, mockOwner } = createMockPlatformWithOwner()

            await databaseConnection().getRepository('user').save(mockOwner)
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const otherMockUser = createMockUser()
            await databaseConnection().getRepository('user').save(otherMockUser)

            const testToken = await generateMockToken({
                id: otherMockUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/users',
                query: {
                    platformId: mockPlatform.id,
                },
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
            const { mockOwner, mockPlatform } = createMockPlatformWithOwner()

            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                status: UserStatus.ACTIVE,
            })

            await databaseConnection()
                .getRepository('user')
                .save([mockOwner, mockUser])
            await databaseConnection().getRepository('platform').save([mockPlatform])

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
                url: `/v1/users/${mockUser.id}`,
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

            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

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
                url: `/v1/users/${nonExistentUserId}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Requires principal to be platform owner', async () => {
            // arrange
            const { mockPlatform, mockOwner } = createMockPlatformWithOwner()

            await databaseConnection().getRepository('user').save(mockOwner)
            await databaseConnection().getRepository('platform').save(mockPlatform)

            await databaseConnection().getRepository('user').update(mockOwner.id, {
                platformRole: PlatformRole.MEMBER,
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
                url: `/v1/users/${mockOwner.id}`,
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
    })

    describe('Delete user endpoint', () => {
        it('Removes a user', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockBasicSetup()

            const mockEditor = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection().getRepository('user').save([mockEditor])

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
                url: `/v1/users/${mockEditor.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform } = await mockBasicSetup()

            const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            await databaseConnection().getRepository('user').save([mockUser])

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
                url: `/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })
    })
})
