import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockUser,
    createMockPlatform,
    createMockProject,
    createMockApiKey,
    mockBasicSetup,
} from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import {
    NotificationStatus,
    PlatformRole,
    PrincipalType,
    Project,
    Platform,
    User,
    apId,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import {
    ApiKeyResponseWithValue,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

beforeEach(async () => {
    stripeHelper.getOrCreateCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.uuid())
})

describe('Project API', () => {
    describe('Create Project', () => {
        it('it should create project by user', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)
            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id, role: PlatformRole.OWNER },
            })

            const displayName = faker.animal.bird()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                body: {
                    displayName,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody.displayName).toBe(displayName)
            expect(responseBody.ownerId).toBe(mockUser.id)
            expect(responseBody.platformId).toBe(mockPlatform.id)
        })

        it('it should create project by api key', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)
            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const apiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('api_key').save([apiKey])

            const displayName = faker.animal.bird()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                body: {
                    displayName,
                },
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody.displayName).toBe(displayName)
            expect(responseBody.ownerId).toBe(mockUser.id)
            expect(responseBody.platformId).toBe(mockPlatform.id)
        })
    })

    describe('List Projects by api key', () => {
        it('it should list platform project', async () => {
            const mockUser = createMockUser()
            const mockUser2 = createMockUser()
            await databaseConnection
                .getRepository('user')
                .save([mockUser, mockUser2])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            const mockPlatform2 = createMockPlatform({
                ownerId: mockUser2.id,
            })
            await databaseConnection
                .getRepository('platform')
                .save([mockPlatform, mockPlatform2])

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            const mockProject2 = createMockProject({
                ownerId: mockUser2.id,
                platformId: mockPlatform2.id,
            })
            await databaseConnection
                .getRepository('project')
                .save([mockProject, mockProject2])

            const apiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('api_key').save([apiKey])

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/projects',
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data.length).toBe(1)
            expect(responseBody.data[0].id).toEqual(mockProject.id)
        })
    })

    describe('List Projects by user', () => {
        it('it should list owned projects', async () => {
            const mockUser = createMockUser()
            const mockUser2 = createMockUser()
            await databaseConnection
                .getRepository('user')
                .save([mockUser, mockUser2])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            const mockPlatform2 = createMockPlatform({
                ownerId: mockUser2.id,
            })
            await databaseConnection.getRepository('platform').save([mockPlatform, mockPlatform2])

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            const mockProject2 = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform2.id,
            })
            const mockProject3 = createMockProject({
                ownerId: mockUser2.id,
                platformId: mockPlatform2.id,
            })
            await databaseConnection
                .getRepository('project')
                .save([mockProject, mockProject2, mockProject3])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject2.id,
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/users/projects',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data.length).toBe(2)
            expect(responseBody.data[0].id).toEqual(mockProject.id)
            expect(responseBody.data[1].id).toEqual(mockProject2.id)
        })
    })

    describe('Update Project', () => {
        it('it should update project and ignore plan as project owner', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
                    teamMembers,
                },
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

        it('It should not update project if api key is not platform owner', async () => {
            const { mockProject } = await createProjectAndPlatformAndApiKey()
            const { mockApiKey } = await createProjectAndPlatformAndApiKey()
            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })
            const request = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
                    teamMembers,
                },
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProject.id,
                body: request,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('it should update project as platform owner with api key', async () => {
            const { mockProject, mockApiKey } =
        await createProjectAndPlatformAndApiKey()
            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })
            const request = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
                    teamMembers,
                },
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects/' + mockProject.id,
                body: request,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('it should update project as platform owner', async () => {
            const { mockProject, mockPlatform, mockUser } =
        await createProjectAndPlatformAndApiKey()
            const mockProjectTwo = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection
                .getRepository('project')
                .save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id, role: PlatformRole.OWNER },
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })
            const teamMembers = faker.number.int({ min: 1, max: 100 })
            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
                    teamMembers,
                },
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
            expect(responseBody.plan.tasks).toEqual(tasks)
            expect(responseBody.plan.teamMembers).toEqual(teamMembers)
        })

        it('Fails if user is not platform owner', async () => {
            const memberUser = createMockUser()
            const platfornOwnerUser = createMockUser()

            await databaseConnection
                .getRepository('user')
                .save([memberUser, platfornOwnerUser])

            const mockPlatform = createMockPlatform({
                ownerId: platfornOwnerUser.id,
            })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: platfornOwnerUser.id,
                platformId: mockPlatform.id,
            })
            const mockProjectTwo = createMockProject({
                ownerId: platfornOwnerUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection
                .getRepository('project')
                .save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: memberUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id, role: PlatformRole.MEMBER },
            })

            const request: UpdateProjectPlatformRequest = {
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

        it('Fails if project is deleted', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockBasicSetup({
                project: {
                    deleted: new Date().toISOString(),
                },
            })

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                    role: PlatformRole.OWNER,
                },
            })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${mockProject.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityId).toBe(mockProject.id)
            expect(responseBody?.params?.entityType).toBe('project')
        })
    })

    describe('Delete Project endpoint', () => {
        it('Soft deletes project by id', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockBasicSetup()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                    role: PlatformRole.OWNER,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const deletedProject = await databaseConnection.getRepository('project').findOneBy({ id: mockProject.id })
            expect(deletedProject?.deleted).not.toBeNull()
        })

        it('Requires user to be platform owner', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockBasicSetup()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                    role: PlatformRole.MEMBER,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it('Deletes projects in current platform only', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockBasicSetup()

            const randomPlatformId = apId()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: randomPlatformId,
                    role: PlatformRole.OWNER,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityId).toBe(mockProject.id)
            expect(responseBody?.params?.entityType).toBe('project')
        })

        it('Fails if project is already deleted', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockBasicSetup({
                project: {
                    deleted: new Date().toISOString(),
                },
            })

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                    role: PlatformRole.OWNER,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityId).toBe(mockProject.id)
            expect(responseBody?.params?.entityType).toBe('project')
        })
    })
})

async function createProjectAndPlatformAndApiKey(): Promise<{
    mockApiKey: ApiKeyResponseWithValue
    mockPlatform: Platform
    mockProject: Project
    mockUser: User
}> {
    const mockUser = createMockUser()
    await databaseConnection.getRepository('user').save(mockUser)

    const mockPlatform = createMockPlatform({
        ownerId: mockUser.id,
    })
    await databaseConnection.getRepository('platform').save(mockPlatform)

    const mockProject = createMockProject({
        ownerId: mockUser.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('project').save(mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('api_key').save(mockApiKey)

    return {
        mockApiKey,
        mockPlatform,
        mockProject,
        mockUser,
    }
}
