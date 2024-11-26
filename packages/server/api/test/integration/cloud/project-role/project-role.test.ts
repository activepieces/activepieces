import { PrincipalType, ProjectRole, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProjectRole, createMockUser, mockBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Role API', () => {
    describe('Create Project Role', () => {
        it('should create a new project role', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })
            
            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-roles',
                body: projectRole,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json() as ProjectRole
            expect(responseBody.id).toBeDefined()
            expect(responseBody.platformId).toBe(mockPlatformOne.id)
            expect(responseBody.name).toBe(projectRole.name)
            expect(responseBody.permissions).toEqual(projectRole.permissions)
        })

        it('should fail to create a new project role if user is not platform owner', async () => {
            const { mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const nonOwnerUserId = createMockUser()
            await databaseConnection().getRepository('user').save(nonOwnerUserId)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonOwnerUserId.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-roles',
                body: projectRole,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

    })

    describe('Get Project Role', () => {
        it('should get all project roles', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/project-roles',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should able to get all project roles if user is not platform owner', async () => {
            const { mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const nonOwnerUserId = createMockUser()
            await databaseConnection().getRepository('user').save(nonOwnerUserId)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonOwnerUserId.id,
                platform: { id: mockPlatformOne.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/project-roles',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Update Project Role', () => {
        it('should update a project role', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const request: UpdateProjectRoleRequestBody = {
                name: faker.lorem.word(),
                permissions: ['read', 'write'],
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-roles/${projectRole.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to update if user is not platform owner', async () => {
            const { mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const nonOwnerUserId = createMockUser()
            await databaseConnection().getRepository('user').save(nonOwnerUserId)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonOwnerUserId.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const request: UpdateProjectRoleRequestBody = {
                name: faker.lorem.word(),
                permissions: ['read', 'write'],
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-roles/${projectRole.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Delete Project Role', () => {
        it('should delete a project role', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-roles/${projectRole.name}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to delete a project role if user is not platform owner', async () => {
            const { mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const nonOwnerUserId = createMockUser()
            await databaseConnection().getRepository('user').save(nonOwnerUserId)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonOwnerUserId.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-roles/${projectRole.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should fail to delete a project role if project role does not exist', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-roles/${faker.lorem.word()}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
}) 