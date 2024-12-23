import { PrincipalType, ProjectRelease, ProjectReleaseType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockFile, createMockGitRepo, createMockProjectRelease, mockBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Release API', () => {
    describe('Create Project Release', () => {
        it('should create a new project release', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
                projectId: mockProjectOne.id,
            })

            const file = createMockFile({ platformId: mockPlatformOne.id, projectId: mockProjectOne.id })
            await databaseConnection().getRepository('file').save(file)

            const projectRelease = createMockProjectRelease({ projectId: mockProjectOne.id, fileId: file.id, importedBy: mockUserOne.id, type: ProjectReleaseType.GIT })
            await databaseConnection().getRepository('project_release').save(projectRelease)

            const mockGitRepo = createMockGitRepo({ projectId: mockProjectOne.id })
            await databaseConnection().getRepository('git_repo').save(mockGitRepo)

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-releases',
                body: {
                    fileId: file.id,
                    name: projectRelease.name,
                    description: projectRelease.description,
                    type: ProjectReleaseType.GIT,
                    repoId: mockGitRepo.id,
                    selectedFlowsIds: [],
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            
            const responseBody = response?.json() as ProjectRelease
            expect(responseBody.id).toBeDefined()
            expect(responseBody.projectId).toBe(mockProjectOne.id)
            expect(responseBody.importedBy).toBe(mockUserOne.id)
            expect(responseBody.fileId).toBe(projectRelease.fileId)
            expect(responseBody.name).toBe(projectRelease.name)
            expect(responseBody.description).toBe(projectRelease.description)
        })
    })
}) 