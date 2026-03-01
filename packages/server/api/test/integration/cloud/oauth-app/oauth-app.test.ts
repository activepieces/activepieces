import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { PlatformRole, PrincipalType, UpsertOAuth2AppRequest } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockOAuthApp,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

const upsertRequest: UpsertOAuth2AppRequest = {
    pieceName: faker.lorem.word(),
    clientId: faker.lorem.word(),
    clientSecret: faker.lorem.word(),
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('OAuth App API', () => {
    describe('Upsert OAuth APP API', () => {
        it('new OAuth App', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/oauth-apps', upsertRequest)

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toHaveLength(21)
            expect(responseBody.platformId).toBe(ctx.platform.id)
            expect(responseBody.pieceName).toBe(upsertRequest.pieceName)
            expect(responseBody.clientId).toBe(upsertRequest.clientId)
            expect(responseBody.clientSecret).toBeUndefined()
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
            const { mockOwner: mockUserTwo, mockPlatform: mockPlatformTwo } = await mockAndSaveBasicSetup()

            const mockOAuthApp = await createMockOAuthApp({
                platformId: mockPlatformTwo.id,
            })

            await db.update('user', mockUserTwo.id, {
                platformRole: PlatformRole.MEMBER,
            })
            await db.save('oauth_app', mockOAuthApp)

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
            const ctx = await createTestContext(app!)

            const mockOAuthApp = await createMockOAuthApp({
                platformId: ctx.platform.id,
            })
            await db.save('oauth_app', mockOAuthApp)

            // act
            const response = await ctx.delete(`/v1/oauth-apps/${mockOAuthApp.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('List OAuth Apps endpoint', () => {
        it('should list OAuth Apps by platform owner', async () => {
            // arrange
            const ctx = await createTestContext(app!)

            const mockOAuthAppsOne = await createMockOAuthApp({
                platformId: ctx.platform.id,
            })

            await db.save('oauth_app', [mockOAuthAppsOne])

            // act
            const response = await ctx.get('/v1/oauth-apps')

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOAuthAppsOne.id)
            expect(responseBody.data[0].clientSecret).toBeUndefined()
        })

        it('should list OAuth Apps by platform member', async () => {
            // arrange
            const { mockPlatform: mockPlatformOne } = await mockAndSaveBasicSetup()
            const { mockPlatform: mockPlatformTwo } = await mockAndSaveBasicSetup()
            const { mockUser: mockUserTwo } = await mockBasicUser({
                user: {
                    platformId: mockPlatformTwo.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockOAuthAppsOne = await createMockOAuthApp({
                platformId: mockPlatformOne.id,
            })
            const mockOAuthAppsTwo = await createMockOAuthApp({
                platformId: mockPlatformTwo.id,
            })

            await db.save('oauth_app', [mockOAuthAppsOne, mockOAuthAppsTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                platform: { id: mockPlatformTwo.id },
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
            expect(responseBody.data[0].id).toBe(mockOAuthAppsTwo.id)
            expect(responseBody.data[0].clientSecret).toBeUndefined()
        })
    })
})
