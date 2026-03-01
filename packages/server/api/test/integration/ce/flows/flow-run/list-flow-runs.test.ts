import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../../helpers/mocks'
let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('List flow runs endpoint', () => {
    it('should return 200', async () => {
        // arrange
        const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup()

        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
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
