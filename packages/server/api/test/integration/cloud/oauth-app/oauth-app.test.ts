import { UpsertOAuth2AppRequest } from '@activepieces/ee-shared'
import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockOAuthApp,
    createMockPlatform,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

const upsertRequest: UpsertOAuth2AppRequest = {
    pieceName: faker.lorem.word(),
    clientId: faker.lorem.word(),
    clientSecret: faker.lorem.word(),
}

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('OAuth App API', () => {
    describe('Upsert OAuth APP API', () => {
        it('new OAuth App', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/oauth-apps',
                body: upsertRequest,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toHaveLength(21)
            expect(responseBody.platformId).toBe(mockPlatform.id)
            expect(responseBody.pieceName).toBe(upsertRequest.pieceName)
            expect(responseBody.clientId).toBe(upsertRequest.clientId)
            expect(responseBody.clientSecret).toBeUndefined()
        })


        it('Fails if user is not platform owner', async () => {
            // arrange
            const mockOwner = createMockUser()
            await databaseConnection().getRepository('user').save([mockOwner])

            const mockPlatform = createMockPlatform({ ownerId: mockOwner.id })
            await databaseConnection().getRepository('platform').save([mockPlatform])


            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            })
            await databaseConnection().getRepository('user').save([mockUser])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/oauth-apps',
                body: upsertRequest,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Delete OAuth App', () => {
        it('Forbid by Non Owner', async () => {
            // arrange
            const { mockOwner: mockUserTwo, mockPlatform: mockPlatformTwo } = await mockBasicSetup()


            const mockOAuthApp = createMockOAuthApp({
                platformId: mockPlatformTwo.id,
            })

            await databaseConnection().getRepository('user').update(mockUserTwo.id, {
                platformRole: PlatformRole.MEMBER,
            })
            await databaseConnection().getRepository('oauth_app').save(mockOAuthApp)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                platform: { id: mockPlatformTwo.id },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/oauth-apps/${mockOAuthApp.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('By Id', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockBasicSetup()

            const mockOAuthApp = createMockOAuthApp({
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('oauth_app').save(mockOAuthApp)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/oauth-apps/${mockOAuthApp.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('List OAuth Apps endpoint', () => {
        it('should list OAuth Apps by platform owner', async () => {
            // arrange
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()


            const mockOAuthAppsOne = createMockOAuthApp({
                platformId: mockPlatformOne.id,
            })

            await databaseConnection()
                .getRepository('oauth_app')
                .save([mockOAuthAppsOne])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/oauth-apps',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOAuthAppsOne.id)
            expect(responseBody.data[0].clientSecret).toBeUndefined()
        })

        it('should list OAuth Apps by platform member', async () => {
            // arrange
            const { mockPlatform: mockPlatformTwo } = await mockBasicSetup()
            const { mockOwner: mockUserTwo, mockPlatform: mockPlatformOne } = await mockBasicSetup()

            const mockOAuthAppsOne = createMockOAuthApp({
                platformId: mockPlatformOne.id,
            })
            const mockOAuthAppsTwo = createMockOAuthApp({
                platformId: mockPlatformTwo.id,
            })

            await databaseConnection()
                .getRepository('oauth_app')
                .save([mockOAuthAppsOne, mockOAuthAppsTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                platform: { id: mockPlatformOne.id },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/oauth-apps',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOAuthAppsOne.id)
            expect(responseBody.data[0].clientSecret).toBeUndefined()
        })
    })
})
