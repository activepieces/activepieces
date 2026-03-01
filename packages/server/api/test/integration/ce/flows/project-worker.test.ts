import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Project Worker API', () => {
    describe('Get worker project endpoint', () => {
        it('Returns worker project', async () => {
            // arrange
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                platform: {
                    id: mockPlatform.id,
                },
                projectId: mockProject.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/worker/project',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody?.id).toBe(mockProject.id)
        })
    })
})
