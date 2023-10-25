import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { createMockUser } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { faker } from '@faker-js/faker'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
})

describe('admin add platform endpoint', () => {
    it('creates a new platform', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)
        const mockPlatformName = faker.lorem.word()
        // act
        const response = await app?.inject({
            method: 'POST',
            url: '/v1/admin/platforms',
            headers: {
                'api-key': 'api-key',
            },
            body: {
                ownerId: mockUser.id,
                name: mockPlatformName,
            },
        })

        // assert
        const responseBody = response?.json()

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        expect(responseBody.id).toHaveLength(21)
        expect(responseBody.ownerId).toBe(mockUser.id)
        expect(responseBody.name).toBe(mockPlatformName)
        expect(responseBody.primaryColor).toBe('#000000')
        expect(responseBody.logoIconUrl).toBe('https://activepieces.com/assets/images/logo-icon.png')
        expect(responseBody.fullLogoUrl).toBe('https://activepieces.com/assets/images/logo-full.png')
        expect(responseBody.favIconUrl).toBe('https://activepieces.com/assets/images/favicon.png')
    })
})
