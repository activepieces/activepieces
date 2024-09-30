import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { setupServer } from '../../../../../src/app/server'
import { generateMockToken } from '../../../../helpers/auth'
import { createMockUser } from '../../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('List flow runs endpoint', () => {
    it('should return 200', async () => {
    // arrange
        const mockUser = createMockUser()
        await databaseConnection().getRepository('user').save(mockUser)

        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
        })

        // act
        const response = await app?.inject({
            method: 'GET',
            url: '/v1/flow-runs',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })

        // assert
        expect(response?.statusCode).toBe(200)
    })
})
