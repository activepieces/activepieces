import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { apId, ErrorCode } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Error handler wire format', () => {
    it('returns 401 for an invalid bearer token', async () => {
        // Use a route without required query params and a valid ApId-shaped path
        // param, so schema validation (which runs before the auth preHandler)
        // does not 400 before auth rejects. The body shape on this path is
        // fastify's default error serialization (same as before the evlog
        // migration) — only the status code is contractual here.
        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/flows/${apId()}`,
            headers: {
                authorization: 'Bearer invalid-token',
            },
        })

        expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it('returns { code, params } with correct status for ENTITY_NOT_FOUND (ActivepiecesError)', async () => {
        const ctx = await createTestContext(app!)
        const response = await ctx.get(`/v1/flows/${apId()}`)

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        const body = response.json()
        expect(body).toMatchObject({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: expect.anything(),
        })
        expect(Object.keys(body)).toEqual(expect.arrayContaining(['code', 'params']))
    })
})
