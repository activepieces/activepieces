import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockProject } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { createMockProjectMember } from '../../../helpers/mocks/project-member-mocks'
import { ProjectMemberStatus } from '@activepieces/ee-shared'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'
import { faker } from '@faker-js/faker'

let app: FastifyInstance | null = null

beforeAll(async () => {
    stripeHelper.getOrCreateCustomer = jest.fn().mockResolvedValue(faker.string.uuid())
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Project Usage API', () => {
    describe('List Project Usage', () => {

        it('should return list', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProjects = Array.from({ length: 10 }, () => createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id }))
            await databaseConnection.getRepository('project').save(mockProjects)

            const mockInvitedUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockInvitedUser)
            const mockProjectMember = createMockProjectMember({
                userId: mockInvitedUser.id,
                projectId: mockProjects[0].id,
                status: ProjectMemberStatus.PENDING,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)


            const testToken = await generateMockToken({
                id: mockUser.id,
                platform: { id: mockPlatform.id, role: 'OWNER' },
            })


            const response = await app?.inject({
                method: 'GET',
                url: '/v1/project-usages',
                query: {
                    projectIds: [mockProjects[0].id],
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.length).toBe(1)
            expect(responseBody[0].teamMembers).toBe(2)
            expect(responseBody[0].consumedTasks).toBe(0)
        })

    })

    it('it should return eforbidden if user is not platform owner', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)
  
        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection.getRepository('platform').save(mockPlatform)
  
        const mockProjects = Array.from({ length: 10 }, () => createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id }))
        await databaseConnection.getRepository('project').save(mockProjects)
  
        const userMember = createMockUser( { platformId: mockPlatform.id })
        await databaseConnection.getRepository('user').save(userMember)

        const testToken = await generateMockToken({
            id: userMember.id,
            platform: { id: mockPlatform.id, role: 'MEMBER' },
        })
  
  
        const response = await app?.inject({
            method: 'GET',
            url: '/v1/project-usages',
            query: {
                projectIds: [mockProjects[0].id],
            },
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })
  
        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
  
    })      
})
