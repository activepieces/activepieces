import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { FastifyInstance } from 'fastify'
import { createMockGitRepo, createMockProject, createMockUser } from 'packages/backend/test/helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { faker } from '@faker-js/faker'
import { generateMockToken } from 'packages/backend/test/helpers/auth'
import { PrincipalType } from '@activepieces/shared'

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

            const mockProject = createMockProject({ ownerId: mockUser.id })
            const mockProject2 = createMockProject({ ownerId: mockUser2.id })
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

            const mockProject = createMockProject({ ownerId: mockUser.id })
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

    describe('List API', () => {


        it('should list a git repo', async () => {

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockProject = createMockProject({ ownerId: mockUser.id })
            const mockProject2 = createMockProject({ ownerId: mockUser.id })
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
