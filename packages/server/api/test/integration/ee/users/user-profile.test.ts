import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('User Profile API', () => {
    describe('GET /v1/users/:id', () => {
        it('should get user by id', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get(`/v1/users/${ctx.user.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(ctx.user.id)
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.email).toBe(ctx.userIdentity.email)
            expect(body.firstName).toBe(ctx.userIdentity.firstName)
            expect(body.lastName).toBe(ctx.userIdentity.lastName)
        })

        it('should return 404 for non-existent user', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get(`/v1/users/${apId()}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should return 404 for user on different platform', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const response = await ctx2.get(`/v1/users/${ctx1.user.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('DELETE /v1/users/me/profile-picture', () => {
        it('should delete profile picture', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.delete('/v1/users/me/profile-picture')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.success).toBe(true)
        })
    })
})
