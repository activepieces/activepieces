import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ApiKeyResponseWithValue,
    DefaultProjectRole,
    FlowStatus,

    Permission,
    Platform,
    PlatformRole,
    PrincipalType,
    Project,
    ProjectType,
    RoleType,
    UpdateProjectPlatformRequest,
    User } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    createMockFlow,
    createMockProject,
    createMockProjectMember,
    createMockProjectRole,
    createMockUser,
    createMockUserIdentity,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null


beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
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
                url: '/api/v1/projects',
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
            await db.save('api_key', apiKey)

            const displayName = faker.animal.bird()
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects',
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
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
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
                platform: {
                    id: mockPlatformTwo.id,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
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

            await db.save('user', mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await db.save('project', mockProject)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,

                platform: {
                    id: mockPlatform.id,
                },
            })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                plan: {
                },
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects/' + mockProject.id,
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
        })

        it('it should update project as platform owner with api key', async () => {
            const { mockProject, mockApiKey } =
                await createProjectAndPlatformAndApiKey()
            const request = {
                displayName: faker.animal.bird(),
                plan: {
                },
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects/' + mockProject.id,
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
            await db.save('project', [mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,

                platform: { id: mockPlatform.id },
            })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                plan: {
                },
            }

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects/' + mockProjectTwo.id,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.displayName).toBe(request.displayName)
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
            await db.save('project', [mockProject, mockProjectTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: memberUser.id,

                platform: { id: mockPlatform.id },
            })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects/' + mockProjectTwo.id,
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
                
                platform: {
                    id: mockProject.platformId,
                },
            })

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/projects/${mockProject.id}`,
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

            await db.save('user', mockUser)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await db.save('project', mockProject)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,

                platform: {
                    id: mockPlatform.id,
                },
            })

            const metadata = { foo: 'bar' }

            const request: UpdateProjectPlatformRequest = {
                displayName: faker.animal.bird(),
                metadata,
                plan: {
                },
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/projects/' + mockProject.id,
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
            expect(responseBody.metadata).toEqual(metadata)
        })
    })

    describe('Delete Project endpoint', () => {
        it('Soft deletes project by id', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockProjectToDelete = createMockProject({ ownerId: mockOwner.id, platformId: mockPlatform.id })
            await db.save('project', mockProjectToDelete)

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,

                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/projects/${mockProjectToDelete.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const deletedProject = await databaseConnection().getRepository('project').findOne({ where: { id: mockProjectToDelete.id }, withDeleted: true })
            expect(deletedProject!.deleted).not.toBeNull()
        })

        it('Succeeds if project has enabled flows', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockProjectToDelete = createMockProject({ ownerId: mockOwner.id, platformId: mockPlatform.id })
            await db.save('project', mockProjectToDelete)

            const enabledFlow = createMockFlow({ projectId: mockProjectToDelete.id, status: FlowStatus.ENABLED })
            await db.save('flow', enabledFlow)

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/projects/${mockProjectToDelete.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Requires user to be platform owner', async () => {
            // arrange
            const { mockOwner, mockProject } = await mockAndSaveBasicSetup()

            await db.update('user', mockOwner.id, {
                platformRole: PlatformRole.MEMBER,
            })
            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockProject.platformId,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/projects/${mockProject.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it('Returns 404 and leaves data intact when a platform admin tries to delete a project from another platform', async () => {
            // arrange — two independent platforms
            const { mockOwner: attackerOwner, mockPlatform: attackerPlatform } = await mockAndSaveBasicSetup()
            const { mockOwner: victimOwner, mockPlatform: victimPlatform } = await mockAndSaveBasicSetup()

            const victimProject = createMockProject({ ownerId: victimOwner.id, platformId: victimPlatform.id })
            await db.save('project', victimProject)

            const victimFlow = createMockFlow({ projectId: victimProject.id })
            await db.save('flow', victimFlow)

            const attackerToken = await generateMockToken({
                id: attackerOwner.id,
                type: PrincipalType.USER,
                platform: { id: attackerPlatform.id },
            })

            // act — attempt cross-tenant delete
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/projects/${victimProject.id}`,
                headers: { authorization: `Bearer ${attackerToken}` },
            })

            // assert — denied with ENTITY_NOT_FOUND (avoids cross-tenant existence enumeration)
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response?.json()?.code).toBe('ENTITY_NOT_FOUND')

            // assert — victim project NOT soft-deleted
            const victimProjectAfter = await databaseConnection().getRepository('project').findOne({
                where: { id: victimProject.id },
                withDeleted: true,
            })
            expect(victimProjectAfter?.deleted).toBeNull()

            // assert — victim flow still exists
            const victimFlowAfter = await databaseConnection().getRepository('flow').findOne({
                where: { id: victimFlow.id },
            })
            expect(victimFlowAfter).not.toBeNull()
        })

        it('Returns 404 when a platform-scoped API key tries to delete a project from another platform', async () => {
            // arrange — attacker has a SERVICE API key on platform A; victim project lives on platform B
            const { mockPlatform: attackerPlatform } = await mockAndSaveBasicSetup()
            const { mockOwner: victimOwner, mockPlatform: victimPlatform } = await mockAndSaveBasicSetup()

            const attackerApiKey = createMockApiKey({ platformId: attackerPlatform.id })
            await db.save('api_key', attackerApiKey)

            const victimProject = createMockProject({ ownerId: victimOwner.id, platformId: victimPlatform.id })
            await db.save('project', victimProject)

            // act — SERVICE principal bypasses the admin-only middleware
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/projects/${victimProject.id}`,
                headers: { authorization: `Bearer ${attackerApiKey.value}` },
            })

            // assert — the new platform check still blocks it
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response?.json()?.code).toBe('ENTITY_NOT_FOUND')

            const victimProjectAfter = await databaseConnection().getRepository('project').findOne({
                where: { id: victimProject.id },
                withDeleted: true,
            })
            expect(victimProjectAfter?.deleted).toBeNull()
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
            
            await db.save('project', [project1, project2])
            
            const operatorToken = await generateMockToken({
                type: PrincipalType.USER,
                id: operatorUser.id,
                platform: { id: mockPlatform.id },
            })
            
            // act - list projects
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
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
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${operatorToken}`,
                },
                body: {
                    name: 'Should not be allowed',
                },
            })
            
         
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
            
            await db.save('project', project)
            
            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: memberUser.id,
                platform: { id: mockPlatform.id },
            })
            
            // act - list projects
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
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

    describe('List Projects - externalUserId filter', () => {
        it('returns only the personal project of the targeted user', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: targetUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-user-a' },
            })
            const targetPersonal = createMockProject({
                ownerId: targetUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
                displayName: 'Alice Personal',
            })
            await db.save('project', targetPersonal)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-a',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((p: Project) => p.id)
            expect(ids).toEqual([targetPersonal.id])
        })

        it('returns personal + team projects the user is a member of', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: targetUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-user-b' },
            })
            const targetPersonal = createMockProject({
                ownerId: targetUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
            })
            const teamProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'Shared Team',
            })
            const unrelatedTeam = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'Unrelated Team',
            })
            await db.save('project', [targetPersonal, teamProject, unrelatedTeam])

            const role = createMockProjectRole({
                platformId: mockPlatform.id,
                type: RoleType.DEFAULT,
                name: DefaultProjectRole.EDITOR,
                permissions: [Permission.READ_PROJECT],
            })
            await db.save('project_role', role)

            const membership = createMockProjectMember({
                platformId: mockPlatform.id,
                projectId: teamProject.id,
                userId: targetUser.id,
                projectRoleId: role.id,
            })
            await db.save('project_member', membership)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-b',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((p: Project) => p.id).sort()
            expect(ids).toEqual([targetPersonal.id, teamProject.id].sort())
            expect(ids).not.toContain(unrelatedTeam.id)
        })

        it('excludes team projects the user is NOT a member of', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-user-c' },
            })
            const restrictedTeam = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'Restricted',
            })
            await db.save('project', restrictedTeam)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-c',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(0)
        })

        it('returns empty page (not 404) for unknown externalUserId', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=does-not-exist',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data).toEqual([])
        })

        it('is isolated across platforms (externalId on another platform returns empty)', async () => {
            const { mockPlatform: platformOne } = await mockAndSaveBasicSetup()
            const { mockPlatform: platformTwo } = await mockAndSaveBasicSetup()

            const { mockUser: userOnTwo } = await mockBasicUser({
                user: { platformId: platformTwo.id, platformRole: PlatformRole.MEMBER, externalId: 'shared-ext-id' },
            })
            const personalOnTwo = createMockProject({
                ownerId: userOnTwo.id,
                platformId: platformTwo.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', personalOnTwo)

            const apiKeyForPlatformOne = createMockApiKey({ platformId: platformOne.id })
            await db.save('api_key', apiKeyForPlatformOne)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=shared-ext-id',
                headers: { authorization: `Bearer ${apiKeyForPlatformOne.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data).toEqual([])
        })

        it('combines externalUserId with displayName filter', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: targetUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-user-d' },
            })
            const matching = createMockProject({
                ownerId: targetUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
                displayName: 'MatchingPersonal',
            })
            await db.save('project', matching)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const matchResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-d&displayName=Matching',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })
            expect(matchResponse?.statusCode).toBe(StatusCodes.OK)
            expect(matchResponse?.json().data.map((p: Project) => p.id)).toEqual([matching.id])

            const missResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-d&displayName=Nonexistent',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })
            expect(missResponse?.statusCode).toBe(StatusCodes.OK)
            expect(missResponse?.json().data).toEqual([])
        })

        it('without externalUserId, API key still sees every project on the platform', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const extraProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
            })
            await db.save('project', extraProject)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const ids = response?.json().data.map((p: Project) => p.id).sort()
            expect(ids).toEqual([mockProject.id, extraProject.id].sort())
        })

        it('ADMIN USER with externalUserId is forbidden (API-key-only filter)', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: targetUser } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-user-e' },
            })
            const targetPersonal = createMockProject({
                ownerId: targetUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', targetPersonal)

            const adminToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-user-e',
                headers: { authorization: `Bearer ${adminToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('MEMBER USER passing externalUserId of another user is forbidden', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: attacker } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-attacker' },
            })
            const { mockUser: victim } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-victim' },
            })
            const victimPersonal = createMockProject({
                ownerId: victim.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
                displayName: 'Victim Personal',
            })
            await db.save('project', victimPersonal)

            const attackerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: attacker.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-victim',
                headers: { authorization: `Bearer ${attackerToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('MEMBER USER passing own externalUserId is forbidden (privileged-only filter)', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: member } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-self' },
            })
            const ownPersonal = createMockProject({
                ownerId: member.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', ownPersonal)

            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: member.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-self',
                headers: { authorization: `Bearer ${memberToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('OPERATOR USER with externalUserId is forbidden (API-key-only filter)', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: operator } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.OPERATOR },
            })
            await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-target-op' },
            })

            const operatorToken = await generateMockToken({
                type: PrincipalType.USER,
                id: operator.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=ext-target-op',
                headers: { authorization: `Bearer ${operatorToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('MEMBER USER without externalUserId only sees own + team-membership projects', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser: member } = await mockBasicUser({
                user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, externalId: 'ext-member-own' },
            })
            const memberPersonal = createMockProject({
                ownerId: member.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
            })
            const sharedTeam = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'Shared With Member',
            })
            const unrelatedTeam = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'Off-Limits',
            })
            await db.save('project', [memberPersonal, sharedTeam, unrelatedTeam])

            const role = createMockProjectRole({
                platformId: mockPlatform.id,
                type: RoleType.DEFAULT,
                name: DefaultProjectRole.EDITOR,
                permissions: [Permission.READ_PROJECT],
            })
            await db.save('project_role', role)
            const membership = createMockProjectMember({
                platformId: mockPlatform.id,
                projectId: sharedTeam.id,
                userId: member.id,
                projectRoleId: role.id,
            })
            await db.save('project_member', membership)

            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: member.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects',
                headers: { authorization: `Bearer ${memberToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const ids = response?.json().data.map((p: Project) => p.id).sort()
            expect(ids).toEqual([memberPersonal.id, sharedTeam.id].sort())
            expect(ids).not.toContain(unrelatedTeam.id)
        })

        it('Admin USER on platform A is forbidden before cross-platform lookup even runs', async () => {
            const { mockOwner: ownerA, mockPlatform: platformA } = await mockAndSaveBasicSetup()
            const { mockPlatform: platformB } = await mockAndSaveBasicSetup()

            const { mockUser: userOnB } = await mockBasicUser({
                user: { platformId: platformB.id, platformRole: PlatformRole.MEMBER, externalId: 'shared-ext' },
            })
            const personalOnB = createMockProject({
                ownerId: userOnB.id,
                platformId: platformB.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', personalOnB)

            const adminTokenOnA = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerA.id,
                platform: { id: platformA.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=shared-ext',
                headers: { authorization: `Bearer ${adminTokenOnA}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Unauthenticated request to /v1/projects is rejected', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects?externalUserId=anything',
            })
            expect([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]).toContain(response?.statusCode)
        })
    })

    describe('GET /v1/platforms (identity-wide switcher)', () => {
        it('returns projects grouped by platform for the caller identity', async () => {
            const sharedIdentity = createMockUserIdentity({ verified: true })
            await db.save('user_identity', sharedIdentity)

            const { mockPlatform: platformOne } = await mockAndSaveBasicSetup({
                plan: { customDomainsEnabled: false },
            })
            const { mockPlatform: platformTwo } = await mockAndSaveBasicSetup({
                plan: { customDomainsEnabled: false },
            })

            const userOnOne = createMockUser({
                identityId: sharedIdentity.id,
                platformId: platformOne.id,
                platformRole: PlatformRole.ADMIN,
            })
            const userOnTwo = createMockUser({
                identityId: sharedIdentity.id,
                platformId: platformTwo.id,
                platformRole: PlatformRole.ADMIN,
            })
            await db.save('user', [userOnOne, userOnTwo])

            const projectOne = createMockProject({
                ownerId: userOnOne.id,
                platformId: platformOne.id,
                type: ProjectType.PERSONAL,
            })
            const projectTwo = createMockProject({
                ownerId: userOnTwo.id,
                platformId: platformTwo.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', [projectOne, projectTwo])

            const token = await generateMockToken({
                type: PrincipalType.USER,
                id: userOnOne.id,
                platform: { id: platformOne.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/platforms',
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json() as Array<{ platformName: string, projects: Project[] }>
            const projectIds = body.flatMap((entry) => entry.projects.map((p) => p.id))
            expect(projectIds).toContain(projectOne.id)
            expect(projectIds).toContain(projectTwo.id)
        })

        it('rejects API key (USER-only endpoint)', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/platforms',
                headers: { authorization: `Bearer ${apiKey.value}` },
            })

            expect([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]).toContain(response?.statusCode)
        })

        it('old URL /v1/projects/platforms is no longer registered', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const token = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/projects/platforms',
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
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
    await db.save('user', mockUser)

    const mockProject = createMockProject({
        ownerId: mockUser.id,
        platformId: mockPlatform.id,
    })
    await db.save('project', mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await db.save('api_key', mockApiKey)

    return {
        mockApiKey,
        mockPlatform,
        mockProject,
        mockUser,
    }
}
