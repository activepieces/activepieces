import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockProject,
    mockBasicSetup,
} from '../../../helpers/mocks'
import {
    apId,
    PrincipalType,
} from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Flow API for Worker', () => {
    describe('Get Flow from Worker', () => {
        it('List other flow for another project', async () => {
            // arrange
            const { mockPlatform, mockOwner, mockProject } = await mockBasicSetup()

            const mockProject2 = createMockProject({
                platformId: mockPlatform.id,
                ownerId: mockOwner.id,
            })

            await databaseConnection.getRepository('project').save([mockProject2])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
            })
            await databaseConnection.getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
            })
            await databaseConnection.getRepository('flow_version').save([mockFlowVersion])

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject2.id,
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
