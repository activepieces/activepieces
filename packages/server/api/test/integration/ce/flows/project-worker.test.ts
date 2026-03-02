import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
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
        it('should return worker project with correct id', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                platform: {
                    id: mockPlatform.id,
                },
                projectId: mockProject.id,
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/worker/project',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody?.id).toBe(mockProject.id)
        })

        it('should reject request without authorization', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/worker/project',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
