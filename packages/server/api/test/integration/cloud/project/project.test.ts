import {
    ApiKeyResponseWithValue,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    apId,
    FlowStatus,
    NotificationStatus,
    Platform,
    PlatformRole,
    PrincipalType,
    Project,
    User,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/platform/platform-plan/stripe-helper'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockFlow,
    createMockProject,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger


beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!

    stripeHelper(mockLog).createCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.uuid())
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project API', () => {
    describe('Create Project', () => {
        it('it should create project by user', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const displayName = faker.animal.bird()
            const metadata = { foo: 'bar' }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                body: {
                    displayName,
                    metadata,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.displayName).toBe(displayName)
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.platformId).toBe(mockPlatform.id)
            expect(responseBody.metadata).toEqual(metadata)
        })

        it('it should create project by api key', async () => {
            const { mockOwner: mockUser, mockPlatform } = await mockAndSaveBasicSetup()

            const apiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('api_key').save([apiKey])

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
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            await mockAndSaveBasicSetup()

            const apiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('api_key').save([apiKey])

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
        it('it should list owned projects in platform', async () => {
            await mockAndSaveBasicSetup()
            const { mockOwner: mockUserTwo, mockProject: mockProjectTwo, mockPlatform: mockPlatformTwo } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                projectId: mockProjectTwo.id,
                platform: {
                    id: mockPlatformTwo.id,
                },
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
            expect(responseBody.data.length).toBe(1)
            expect(responseBody.data[0].id).toEqual(mockProjectTwo.id)
        })
    })

    describe('Update Project', () => {
        it('it should update project and ignore plan as project owner', async () => {
            const { mockOwner: mockUser, mockPlatform } = await mockAndSaveBasicSetup()

            mockUser.platformId = mockPlatform.id
            mockUser.platformRole = PlatformRole.ADMIN

            await databaseConnection().getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
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
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            expect(responseBody.id).toBe(mockProject.id)
            expect(responseBody.displayName).toBe(request.displayName)
            expect(responseBody.notifyStatus).toBe(request.notifyStatus)
        })

        it('it should update project as platform owner with api key', async () => {
            const { mockProject, mockApiKey } =
                await createProjectAndPlatformAndApiKey()
            const tasks = faker.number.int({ min: 1, max: 100000 })
            const request = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
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
            await databaseConnection()
                .getRepository('project')
                .save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id },
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })
            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                plan: {
                    tasks,
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
        })

        it('Fails if user is not platform owner', async () => {
            const { mockOwner: platformOwnerUser, mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: memberUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockProject = createMockProject({
                ownerId: platformOwnerUser.id,
                platformId: mockPlatform.id,
            })
            const mockProjectTwo = createMockProject({
                ownerId: platformOwnerUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('project')
                .save([mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: memberUser.id,
                projectId: mockProject.id,
                platform: { id: mockPlatform.id },
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
            const { mockOwner, mockProject } = await mockAndSaveBasicSetup({
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
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityId).toBe(mockProject.id)
            expect(responseBody?.params?.entityType).toBe('project')
        })

        it('it should update project with metadata', async () => {
            const { mockOwner: mockUser, mockPlatform } = await mockAndSaveBasicSetup()

            mockUser.platformId = mockPlatform.id
            mockUser.platformRole = PlatformRole.ADMIN

            await databaseConnection().getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
            })

            const tasks = faker.number.int({ min: 1, max: 100000 })
            const metadata = { foo: 'bar' }

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                notifyStatus: NotificationStatus.NEVER,
                metadata,
                plan: {
                    tasks,
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
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockProject.id)
            expect(responseBody.displayName).toBe(request.displayName)
            expect(responseBody.notifyStatus).toBe(request.notifyStatus)
            expect(responseBody.metadata).toEqual(metadata)
        })
    })

    describe('Delete Project endpoint', () => {
        it('Soft deletes project by id', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockProjectToDelete = createMockProject({ ownerId: mockOwner.id, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save([mockProjectToDelete])

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProjectToDelete.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const deletedProject = await databaseConnection().getRepository('project').findOneBy({ id: mockProjectToDelete.id })
            expect(deletedProject?.deleted).not.toBeNull()
        })

        it('Fails if project has enabled flows', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockProjectToDelete = createMockProject({ ownerId: mockOwner.id, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save([mockProjectToDelete])

            const enabledFlow = createMockFlow({ projectId: mockProjectToDelete.id, status: FlowStatus.ENABLED })
            await databaseConnection().getRepository('flow').save([enabledFlow])

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProjectToDelete.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('VALIDATION')
            expect(responseBody?.params?.message).toBe('PROJECT_HAS_ENABLED_FLOWS')
        })

        it('Fails if project to delete is the active project', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
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
            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('VALIDATION')
            expect(responseBody?.params?.message).toBe('ACTIVE_PROJECT')
        })

        it('Requires user to be platform owner', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockAndSaveBasicSetup()

            await databaseConnection().getRepository('user').update(mockOwner.id, {
                platformRole: PlatformRole.MEMBER,
            })
            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
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

        it('Fails if project to delete is not in current platform', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockProjectToDelete = createMockProject({ ownerId: mockOwner.id, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save([mockProjectToDelete])

            const randomPlatformId = apId()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: randomPlatformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${mockProjectToDelete.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Fails if project is already deleted', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const alreadyDeletedProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                deleted: new Date().toISOString(),
            })
            await databaseConnection().getRepository('project').save([alreadyDeletedProject])

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/projects/${alreadyDeletedProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityId).toBe(alreadyDeletedProject.id)
            expect(responseBody?.params?.entityType).toBe('project')
        })
    })

    describe('Platform Operator Access', () => {
        it('Platform operator can access all projects in their platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            
            // Create a platform operator user
            const { mockUser: operatorUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.OPERATOR,
                },
            })
            
            // Create multiple projects owned by different users
            const project1 = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                displayName: 'Project 1',
            })
            const project2 = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                displayName: 'Project 2',
            })
            
            await databaseConnection().getRepository('project').save([project1, project2])
            
            const operatorToken = await generateMockToken({
                type: PrincipalType.USER,
                id: operatorUser.id,
                platform: { id: mockPlatform.id },
            })
            
            // act - list projects
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/users/projects',
                headers: {
                    authorization: `Bearer ${operatorToken}`,
                },
            })
            
            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            // Platform operator should see all projects including the default one
            expect(responseBody.data.length).toBeGreaterThanOrEqual(2)
            const projectNames = responseBody.data.map((p: Project) => p.displayName)
            expect(projectNames).toContain('Project 1')
            expect(projectNames).toContain('Project 2')
        })

        it('Platform operator cannot update platform settings', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            
            const { mockUser: operatorUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.OPERATOR,
                },
            })
            
            const operatorToken = await generateMockToken({
                type: PrincipalType.USER,
                id: operatorUser.id,
                platform: { id: mockPlatform.id },
            })
            
            // act - try to update platform
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${operatorToken}`,
                },
                body: {
                    name: 'Should not be allowed',
                },
            })
            
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Platform member cannot access projects they are not member of', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            
            // Create a regular platform member
            const { mockUser: memberUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            
            // Create a project the member is NOT part of
            const project = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                displayName: 'Restricted Project',
            })
            
            await databaseConnection().getRepository('project').save(project)
            
            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: memberUser.id,
                platform: { id: mockPlatform.id },
            })
            
            // act - list projects
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/users/projects',
                headers: {
                    authorization: `Bearer ${memberToken}`,
                },
            })
            
            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data).toHaveLength(0) // Should not see any projects
        })
    })


})

async function createProjectAndPlatformAndApiKey(): Promise<{
    mockApiKey: ApiKeyResponseWithValue
    mockPlatform: Platform
    mockProject: Project
    mockUser: User
}> {
    const { mockOwner: mockUser, mockPlatform } = await mockAndSaveBasicSetup()

    mockUser.platformId = mockPlatform.id
    mockUser.platformRole = PlatformRole.ADMIN
    await databaseConnection().getRepository('user').save(mockUser)

    const mockProject = createMockProject({
        ownerId: mockUser.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('project').save(mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('api_key').save(mockApiKey)

    return {
        mockApiKey,
        mockPlatform,
        mockProject,
        mockUser,
    }
}
