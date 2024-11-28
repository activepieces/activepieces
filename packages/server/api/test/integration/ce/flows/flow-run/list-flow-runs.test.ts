import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../../src/app/database'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { setupServer } from '../../../../../src/app/server'
import { generateMockToken } from '../../../../helpers/auth'
import { createMockPlatform, createMockProject, createMockUser } from '../../../../helpers/mocks'
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
        const mockUser = createMockUser()
        await databaseConnection().getRepository('user').save([mockUser])

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection().getRepository('platform').save(mockPlatform)

        const mockProject = createMockProject({
            ownerId: mockUser.id,
            platformId: mockPlatform.id,
        })
        await databaseConnection().getRepository('project').save([mockProject])

        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
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
