import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    CreateProjectReleaseRequestBody,
    ProjectReleaseType,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Create Project Release', () => {
    it('Fails if projectId does not match', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const apiKey = createMockApiKey({
            platformId: mockPlatform.id,
        })
        await db.save('api_key', apiKey)

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

        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
