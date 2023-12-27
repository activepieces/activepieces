import { FastifyInstance, FastifyRequest } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { authorizationMiddleware } from '../../../../src/app/authentication/authorization-middleware'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('API Security', () => {
    describe('Global API Key Authentication', () => {
        it('Authenticates Admin User using Global API Key', async () => {
            // arrange
            const mockApiKey = '123'
            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/admin/users',
                headers: {
                    'api-key': mockApiKey,
                },
            } as unknown as FastifyRequest

            // act
            const result = authorizationMiddleware(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()
        })

        it('Fails if provided API key is invalid', async () => {
            // arrange
            const mockInvalidApiKey = '321'
            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/admin/users',
                headers: {
                    'api-key': mockInvalidApiKey,
                },
            } as unknown as FastifyRequest

            // act
            const result = authorizationMiddleware(mockRequest)

            // assert
            return result.catch(e => {
                expect(e).toEqual(new ActivepiecesError({
                    code: ErrorCode.INVALID_API_KEY,
                    params: {},
                }))
            })
        })
    })
})
