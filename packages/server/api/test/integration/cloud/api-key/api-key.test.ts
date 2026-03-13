import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('API Key API', () => {
    describe('Create API Key API', () => {
        it('should create a new API Key', async () => {
            const ctx = await createTestContext(app!)

            const mockApiKeyName = faker.lorem.word()
            const response = await ctx.post('/v1/api-keys', {
                displayName: mockApiKeyName,
            })

            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.id).toHaveLength(21)
            expect(responseBody.platformId).toBe(ctx.platform.id)
            expect(responseBody.hashedValue).toBeUndefined()
            expect(responseBody.displayName).toBe(mockApiKeyName)
            expect(responseBody.truncatedValue).toHaveLength(4)
            expect(responseBody.value).toHaveLength(64)
            expect(responseBody.value).toContain('sk-')
        })
    })

    describe('Delete API Key endpoint', () => {
        it('Fail if non owner', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockApiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await db.save('api_key', mockApiKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/api-keys/${mockApiKey.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List API Keys endpoint', () => {
        it('Filters Signing Keys by platform', async () => {
            const ctxOne = await createTestContext(app!)
            const ctxTwo = await createTestContext(app!)

            const mockKeyOne = createMockApiKey({ platformId: ctxOne.platform.id })
            const mockKeyTwo = createMockApiKey({ platformId: ctxTwo.platform.id })
            await db.save('api_key', [mockKeyOne, mockKeyTwo])

            const response = await ctxOne.get('/v1/api-keys')

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockKeyOne.id)
            expect(responseBody.data[0].hashedValue).toBeUndefined()
        })
    })
})
