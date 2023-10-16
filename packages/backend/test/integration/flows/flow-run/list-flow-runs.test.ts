import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateTestToken } from '../../../helpers/auth'

beforeAll(async () => {
    await databaseConnection.initialize()
})

afterAll(async () => {
    await databaseConnection.destroy()
})

describe('List flow runs endpoint', () => {
    it('should return 200', async () => {
        // arrange
        const app = await setupApp()
        const testToken = await generateTestToken()

        // act
        const response = await app.inject({
            method: 'GET',
            url: '/v1/flow-runs',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })

        // assert
        expect(response.statusCode).toBe(200)
    })
})
