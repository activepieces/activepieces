import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { faker } from '@faker-js/faker'
import { PrincipalType } from '@activepieces/shared'
import { createMockUser, createMockProject, createMockGitRepo, createMockPlatform } from '../../../helpers/mocks'
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

            const mockUser = createMockUser()
            const mockUser2 = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser, mockUser2])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            const mockProject2 = createMockProject({ ownerId: mockUser2.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save([mockProject, mockProject2])


            const request = {
                projectId: mockProject2.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
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

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)


            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
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
            expect(Object.keys(responseBody).length).toBe(6)
            expect(responseBody.sshPrivateKey).toBeUndefined()
            expect(responseBody.remoteUrl).toBe(request.remoteUrl)
            expect(responseBody.branch).toBe(request.branch)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.id).toBeDefined()
            expect(responseBody.projectId).toBe(mockProject.id)
        })
    })

    describe('Delete API', () => {

        it('should delete a git repo', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)


            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

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

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            const mockProject2 = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save([mockProject, mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection.getRepository('git_repo').save([mockGitRepo, mockGitRepo2])

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

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)


            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            const mockProject2 = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save([mockProject, mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await databaseConnection.getRepository('git_repo').save([mockGitRepo, mockGitRepo2])

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
            expect(Object.keys(gitRepo).length).toBe(6)
            expect(gitRepo.sshPrivateKey).toBeUndefined()
            expect(gitRepo.remoteUrl).toBe(mockGitRepo.remoteUrl)
            expect(gitRepo.branch).toBe(mockGitRepo.branch)
            expect(gitRepo.created).toBeDefined()
            expect(gitRepo.updated).toBeDefined()
            expect(gitRepo.id).toBeDefined()
            expect(gitRepo.projectId).toBe(mockProject.id)
        })
    })


})
