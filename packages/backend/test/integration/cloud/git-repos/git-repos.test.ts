import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Git API', () => {
    describe('Push API', () => {
        it('should push flows', async () => {
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/git',
                body: {
                    projectId: 'test',
                },
            })

            expect(response?.statusCode).toBe(200)
        })
    })

})
