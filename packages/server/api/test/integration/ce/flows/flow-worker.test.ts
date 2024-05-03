import { FastifyInstance } from 'fastify'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPlatformWithOwner,
    createMockProject,
} from '../../../helpers/mocks'
import {
    PrincipalType,
    apId,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'

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
    describe('Get Flow form Worker', () => {
        it('List other flow for another project', async () => {
            // arrange
            const { mockPlatform } = await createMockPlatformWithOwner()
            const mockProject = await createMockProject({
                platformId: mockPlatform.id,
            })
            const mockProject2 = await createMockProject({
                platformId: mockPlatform.id,
            })

            await databaseConnection.getRepository('project').save([mockProject, mockProject2])

            const mockFlow = await createMockFlow({
                projectId: mockProject.id,
            })
            await databaseConnection.getRepository('flow').save([mockFlow])

            const mockFlowVersion = await createMockFlowVersion({
                flowId: mockProject.id,
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
                }
            })
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

})
