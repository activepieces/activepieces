import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
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

describe('API Key API', () => {
    describe('Create API Key API', () => {
        it('should create a new API Key', async () => {
            const { mockOwner, mockPlatform } = await mockBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
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

    })

    describe('Delete API Key endpoint', () => {
        it('Fail if non owner', async () => {
            const { mockPlatform } = await mockBasicSetup()
            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            })
            await databaseConnection().getRepository('user').save([mockUser])
            const mockApiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })

            await databaseConnection().getRepository('api_key').save(mockApiKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/api-keys/${mockApiKey.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List API Keys endpoint', () => {
        it('Filters Signing Keys by platform', async () => {
            // arrange
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const { mockPlatform: mockPlatformTwo } = await mockBasicSetup()


            const mockKeyOne = createMockApiKey({
                platformId: mockPlatformOne.id,
            })

            const mockKeyTwo = createMockApiKey({
                platformId: mockPlatformTwo.id,
            })

            await databaseConnection()
                .getRepository('api_key')
                .save([mockKeyOne, mockKeyTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
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
