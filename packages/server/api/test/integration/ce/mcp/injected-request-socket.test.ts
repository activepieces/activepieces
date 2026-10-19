import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('the socket an injected request carries', () => {
    it('can be closed the way a real one can, so a library draining the body does not throw after the test ends', async () => {
        const seen: { destroySoon?: unknown } = {}

        app.addHook('onRequest', async (request) => {
            seen.destroySoon = request.raw.socket?.destroySoon
        })

        const response = await app.inject({ method: 'GET', url: '/api/v1/flags' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(typeof seen.destroySoon).toBe('function')
    })
})
