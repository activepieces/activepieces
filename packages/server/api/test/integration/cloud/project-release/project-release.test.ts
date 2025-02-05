import {
    CreateProjectReleaseRequestBody,
    ProjectReleaseType,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import {
    createMockApiKey,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})


describe('Create Project Release', () => {
    it('Fails if projectId does not match', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const apiKey = createMockApiKey({
            platformId: mockPlatform.id,
        })
        await databaseConnection().getRepository('api_key').save([apiKey])

        const request: CreateProjectReleaseRequestBody = {
            name: faker.animal.bird(),
            description: faker.lorem.sentence(),
            selectedFlowsIds: [],
            projectId: faker.string.uuid(),
            type: ProjectReleaseType.GIT,
        }

        const response = await app?.inject({
            method: 'POST',
            url: '/v1/project-releases',
            body: request,
            headers: {
                authorization: `Bearer ${apiKey.value}`,
            },
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})
