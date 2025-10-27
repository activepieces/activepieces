import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null
const NOT_FOUND_FLOW_ID = '8hfKOpm3kY1yAi1ApYOa1'
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
        const { mockProject } = await mockAndSaveBasicSetup()
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            projectId: mockProject.id,
        })

        const response = await app?.inject({
            method: 'GET',
            url: `/v1/webhooks/${NOT_FOUND_FLOW_ID}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.GONE)
    })
})
