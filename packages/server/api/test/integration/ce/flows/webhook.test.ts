import { FlowStatus, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null
const MOCK_FLOW_ID = '8hfKOpm3kY1yAi1ApYOa1'
beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()

})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Webhook Service', () => {
    it('should return GONE if the flow is not found', async () => {
        const { mockOwner } = await mockAndSaveBasicSetup()
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            platform: {
                id: mockPlatform.id,
            },
        })

        const response = await app?.inject({
            method: 'GET',
            url: `/v1/webhooks/${MOCK_FLOW_ID}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.GONE)
    }),
    it('should return NOT FOUND if the flow is disabled', async () => {
        const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()
        const { mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.DISABLED,
        })
        await databaseConnection().getRepository('flow').save([mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await databaseConnection().getRepository('flow_version').save([mockFlowVersion])
        await databaseConnection().getRepository('flow').update(mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'GET',
            url: `/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
