import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ErrorCode,
    PrincipalType,
    ProjectType,
    TeamProjectsLimit,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
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

describe('Project API (CE)', () => {
    describe('Create Project', () => {
        it('should create one team project', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                project: { type: ProjectType.PERSONAL },
                plan: { teamProjectsLimit: TeamProjectsLimit.ONE },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const displayName = faker.animal.bird()
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects',
                body: { displayName },
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody.displayName).toBe(displayName)
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.platformId).toBe(mockPlatform.id)
        })

        it('should fail to create a second team project', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { teamProjectsLimit: TeamProjectsLimit.ONE },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects',
                body: { displayName: faker.animal.bird() },
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe(ErrorCode.FEATURE_DISABLED)
        })
    })
})
