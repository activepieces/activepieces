import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockProject } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { faker } from '@faker-js/faker'
import { apId } from '@activepieces/shared'
import { stripeHelper } from '../../../../src/app/ee/billing/stripe/stripe-helper'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Project Plan API', () => {
    describe('Update Project Plan', () => {
        it('should update an existing project plan', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const testToken = await generateMockToken({
                id: mockUser.id,
                platform: { id: mockPlatform.id, role: 'OWNER' },
            })
            stripeHelper.getOrCreateCustomer = jest.fn().mockResolvedValue(faker.string.uuid())


            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProject.id + '/plan',
                body: {
                    tasks,
                    teamMembers,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseBody = response?.json()
            expect(responseBody.tasks).toBe(tasks)
            expect(responseBody.teamMembers).toBe(teamMembers)
            expect(responseBody.projectId).toBe(mockProject.id)
        })
        

        it('should fail if user is not platform owner', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id })
            await databaseConnection.getRepository('project').save(mockProject)


            const nonOwnerUserId = apId()
            const testToken = await generateMockToken({
                id: nonOwnerUserId,
                platform: { id: mockPlatform.id, role: 'OWNER' },
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProject.id + '/plan',
                body: {
                    tasks,
                    teamMembers,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    
    })
})
