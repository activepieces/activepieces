import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { mockBasicUser } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Tags API', () => {
    describe('POST /v1/tags (Create)', () => {
        it('should create a tag', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/tags', {
                name: 'test-tag',
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.name).toBe('test-tag')
            expect(body.id).toBeDefined()
            expect(body.platformId).toBe(ctx.platform.id)
        })

        it('should upsert on duplicate name', async () => {
            const ctx = await createTestContext(app!)

            const first = await ctx.post('/v1/tags', { name: 'dup-tag' })
            expect(first?.statusCode).toBe(StatusCodes.CREATED)
            const firstId = first?.json().id

            const second = await ctx.post('/v1/tags', { name: 'dup-tag' })
            expect(second?.statusCode).toBe(StatusCodes.CREATED)
            expect(second?.json().id).toBe(firstId)
        })
    })

    describe('GET /v1/tags (List)', () => {
        it('should list tags', async () => {
            const ctx = await createTestContext(app!)

            await ctx.post('/v1/tags', { name: 'list-tag-1' })
            await ctx.post('/v1/tags', { name: 'list-tag-2' })

            const response = await ctx.get('/v1/tags')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(2)
        })

        it('should return empty list for new platform', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/tags')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toBeDefined()
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('POST /v1/tags/pieces (Assign)', () => {
        it('should assign tags to pieces', async () => {
            const ctx = await createTestContext(app!)

            const tagResponse = await ctx.post('/v1/tags', { name: 'assign-tag' })
            const tagName = tagResponse?.json().name

            const response = await ctx.post('/v1/tags/pieces', {
                piecesName: ['@activepieces/piece-test'],
                tags: [tagName],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('should fail for non-platform-admin', async () => {
            const ctx = await createTestContext(app!)

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const memberToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: { id: ctx.platform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/tags/pieces',
                headers: { authorization: `Bearer ${memberToken}` },
                body: {
                    piecesName: ['@activepieces/piece-test'],
                    tags: ['some-tag'],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
