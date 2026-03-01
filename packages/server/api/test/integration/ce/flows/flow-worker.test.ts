import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockProject,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Flow API for Worker', () => {
    describe('Get Flow from Worker', () => {
        it('List other flow for another project', async () => {
            // arrange
            const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup()

            const mockProject2 = createMockProject({
                platformId: mockPlatform.id,
                ownerId: mockOwner.id,
            })

            await databaseConnection().getRepository('project').save([mockProject2])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
            })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
            })
            await databaseConnection().getRepository('flow_version').save([mockFlowVersion])

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
            })

            const response = await app?.inject({
                method: 'GET',
                url: `/v1/worker/flows/${mockFlowVersion.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

})
