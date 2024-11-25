import { GitBranchType } from '@activepieces/ee-shared'
import { PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockGitRepo,
    createMockProject,
    createMockUser,
    mockBasicSetup,
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

describe('Git API', () => {
    describe('Create API', () => {
        it('should not allow create git repo for other projects', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockEnvironment()

            const mockUser2 = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection().getRepository('user').save(mockUser2)

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser2.id })
            await databaseConnection().getRepository('project').save(mockProject2)

            const request = {
                projectId: mockProject2.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                branchType: GitBranchType.PRODUCTION,
                slug: 'test-slug',
            }

            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/git-repos',
                payload: request,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should create a git repo', async () => {
            const { mockProject, mockOwner } = await mockEnvironment()

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                branchType: GitBranchType.PRODUCTION,
                slug: 'test-slug',
            }
            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/git-repos',
                payload: request,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.sshPrivateKey).toBeUndefined()
            expect(responseBody.remoteUrl).toBe(request.remoteUrl)
            expect(responseBody.branch).toBe(request.branch)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.id).toBeDefined()
            expect(responseBody.projectId).toBe(mockProject.id)
            expect(responseBody.slug).toBe('test-slug')
        })
    })

    describe('Delete API', () => {
        it('should delete a git repo', async () => {
            const { mockProject, mockOwner } = await mockEnvironment()

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            await databaseConnection().getRepository('git_repo').save(mockGitRepo)

            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: '/v1/git-repos/' + mockGitRepo.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
        it('should not allow delete git repo for other projects', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await databaseConnection().getRepository('project').save(mockProject2)

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection()
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: '/v1/git-repos/' + mockGitRepo2.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('List API', () => {
        it('should list return forbidden when api request wrong project', async () => {
            const { mockPlatform, mockProject, mockApiKey, mockOwner } = await mockEnvironment()
            const { mockProject: mockProject3 } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await databaseConnection()
                .getRepository('project')
                .save([mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection()
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/git-repos?projectId=' + mockProject3.id,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
        it('should list return forbidden when user request wrong project', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockEnvironment()
            const { mockProject: mockProject3 } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await databaseConnection()
                .getRepository('project')
                .save([mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection()
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/git-repos?projectId=' + mockProject3.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
        it('should list a git repo', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await databaseConnection()
                .getRepository('project')
                .save([mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection()
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockOwner.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/git-repos?projectId=' + mockProject.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data.length).toBe(1)

            const gitRepo = responseBody.data[0]
            expect(gitRepo.sshPrivateKey).toBeUndefined()
            expect(gitRepo.remoteUrl).toBe(mockGitRepo.remoteUrl)
            expect(gitRepo.branch).toBe(mockGitRepo.branch)
            expect(gitRepo.created).toBeDefined()
            expect(gitRepo.updated).toBeDefined()
            expect(gitRepo.id).toBeDefined()
            expect(gitRepo.projectId).toBe(mockProject.id)
            expect(gitRepo.slug).toBe(mockGitRepo.slug)
        })
    })
})

const mockEnvironment = async () => {
    const { mockPlatform, mockOwner, mockProject } = await mockBasicSetup({
        platform: {
            gitSyncEnabled: true,
        },
    })
    
    const mockApiKey = createMockApiKey({ platformId: mockPlatform.id })
    await databaseConnection().getRepository('api_key').save(mockApiKey)

    return {
        mockPlatform,
        mockOwner,
        mockApiKey,
        mockProject,
    }
}
