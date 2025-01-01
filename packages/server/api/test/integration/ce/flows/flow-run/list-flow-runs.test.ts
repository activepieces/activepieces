import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../../src/app/database'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { setupServer } from '../../../../../src/app/server'
import { generateMockToken } from '../../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../../helpers/mocks'
let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('List flow runs endpoint', () => {
    it('should return 200', async () => {
        // arrange
        const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup()

        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            projectId: mockProject.id,
            platform: {
                id: mockPlatform.id,
            },
        })

        // act
        const response = await app?.inject({
            method: 'GET',
            url: '/v1/flow-runs',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
            query: {
                projectId: mockProject.id,
            },
        })

        // assert
        expect(response?.statusCode).toBe(200)
    })
})
