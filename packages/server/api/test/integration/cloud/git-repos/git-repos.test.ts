import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { faker } from '@faker-js/faker'
import { PrincipalType, apId } from '@activepieces/shared'
import {
    createMockUser,
    createMockProject,
    createMockGitRepo,
    createMockPlatform,
} from '../../../helpers/mocks'
import { generateMockToken } from '../../../helpers/auth'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Git API', () => {
    describe('Create API', () => {
        it('should not allow create git repo for other projects', async () => {
            const { mockPlatform, mockProject, mockUser } = await mockEnvironment()

            const mockUser2 = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('user').save(mockUser2)

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser2.id })
            await databaseConnection.getRepository('project').save(mockProject2)

            const request = {
                projectId: mockProject2.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                slug: 'test-slug',
            }

            const token = await generateMockToken({
                id: mockUser.id,
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
            const { mockProject, mockUser } = await mockEnvironment()

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                slug: 'test-slug',
            }
            const token = await generateMockToken({
                id: mockUser.id,
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

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
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
            const { mockProject, mockUser } = await mockEnvironment()

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            await databaseConnection.getRepository('git_repo').save(mockGitRepo)

            const token = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
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
            const { mockPlatform, mockProject, mockUser } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id })
            await databaseConnection.getRepository('project').save(mockProject2)

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockUser.id,
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
        it('should list a git repo', async () => {
            const { mockPlatform, mockProject, mockUser } = await mockEnvironment()

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id })
            await databaseConnection
                .getRepository('project')
                .save([mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection
                .getRepository('git_repo')
                .save([mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
                type: PrincipalType.USER,
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
    const mockPlatformId = apId()

    const mockUser = createMockUser()
    await databaseConnection.getRepository('user').save(mockUser)

    const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
    await databaseConnection.getRepository('platform').save(mockPlatform)

    mockUser.platformId = mockPlatform.id
    await databaseConnection.getRepository('user').update(mockUser.id, { platformId: mockPlatform.id })

    const mockProject = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser.id })
    await databaseConnection.getRepository('project').save(mockProject)

    return {
        mockPlatform,
        mockUser,
        mockProject,
    }
}
