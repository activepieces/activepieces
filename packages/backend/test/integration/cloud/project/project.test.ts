import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockProject } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { UpdateProjectRequest } from '@activepieces/ee-shared'
import { NotificationStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Project API', () => {
    describe('Update Project', () => {
        it('it should update project as project owner', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)
            const mockProject = createMockProject({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const testToken = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
            })

            const request: UpdateProjectRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProject.id,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json() 
            expect(responseBody.id).toBe(mockProject.id)
            expect(responseBody.displayName).toBe(request.displayName)
            expect(responseBody.notifyStatus).toBe(request.notifyStatus)
        })

        it('it should update project as platform owner', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            const mockProjectTwo = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id, role: 'OWNER' },
            })

            const request: UpdateProjectRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProjectTwo.id,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json() 
            expect(responseBody.displayName).toBe(request.displayName)
            expect(responseBody.notifyStatus).toBe(request.notifyStatus)
        })

        it('Fails if user is not platform owner', async () => {
            const memberUser = createMockUser()
            const platfornOwnerUser = createMockUser()

            await databaseConnection.getRepository('user').save([memberUser, platfornOwnerUser])

            const mockPlatform = createMockPlatform({ ownerId: platfornOwnerUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: platfornOwnerUser.id,
                platformId: mockPlatform.id,
            })
            const mockProjectTwo = createMockProject({
                ownerId: platfornOwnerUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                id: memberUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id, role: 'MEMBER' },
            })

            const request: UpdateProjectRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProjectTwo.id,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })


})
