import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockApiKey } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { PlatformRole, PrincipalType, apId } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('API Key API', () => {
    describe('Create API Key API', () => {
        it('should create a new API Key', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id, role: PlatformRole.OWNER },
            })

            const mockApiKeyName = faker.lorem.word()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/api-keys',
                body: {
                    displayName: mockApiKeyName,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.id).toHaveLength(21)
            expect(responseBody.platformId).toBe(mockPlatform.id)
            expect(responseBody.hashedValue).toBeUndefined()
            expect(responseBody.displayName).toBe(mockApiKeyName)
            expect(responseBody.truncatedValue).toHaveLength(4)
            expect(responseBody.value).toHaveLength(64)
            expect(responseBody.value).toContain('sk-')
        })


        it('Fails if platform is not found', async () => {
            // arrange
            const nonExistentPlatformId = apId()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                platform: {
                    id: nonExistentPlatformId,
                    role: PlatformRole.OWNER,
                },
            })

            const mockApiKeyName = faker.lorem.word()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/api-keys',
                body: {
                    displayName: mockApiKeyName,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        })


    })


    describe('Delete API Key endpoint', () => {
        it('Fail if non owner', async () => {
            // arrange
            const mockUser = createMockUser()
            const mockUserTwo = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser, mockUserTwo])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            const mockPlatform2 = createMockPlatform({ ownerId: mockUserTwo.id })
            await databaseConnection.getRepository('platform').save([mockPlatform, mockPlatform2])

            const mockApiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })

            await databaseConnection.getRepository('api_key').save(mockApiKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                platform: { id: mockPlatform2.id, role: PlatformRole.OWNER },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/api-keys/${mockApiKey.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })


    describe('List API Keys endpoint', () => {
        it('Filters Signing Keys by platform', async () => {
            // arrange
            const mockUserOne = createMockUser()
            const mockUserTwo = createMockUser()
            await databaseConnection.getRepository('user').save([mockUserOne, mockUserTwo])

            const mockPlatformOne = createMockPlatform({ ownerId: mockUserOne.id })
            const mockPlatformTwo = createMockPlatform({ ownerId: mockUserTwo.id })
            await databaseConnection.getRepository('platform').save([mockPlatformOne, mockPlatformTwo])

            const mockKeyOne = createMockApiKey({
                platformId: mockPlatformOne.id,
            })

            const mockKeyTwo = createMockApiKey({
                platformId: mockPlatformTwo.id,
            })

            await databaseConnection.getRepository('api_key').save([mockKeyOne, mockKeyTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id, role: PlatformRole.OWNER },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/api-keys',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockKeyOne.id)
            expect(responseBody.data[0].hashedValue).toBeUndefined()
        })
    })
})
