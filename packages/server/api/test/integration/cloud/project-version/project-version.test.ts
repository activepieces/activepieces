import { PrincipalType, ProjectVersion } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockFile, createMockProjectVersion, mockBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Version API', () => {
    describe('Create Project Version', () => {
        it('should create a new project version', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
                projectId: mockProjectOne.id,
            })

            const file = createMockFile({ platformId: mockPlatformOne.id, projectId: mockProjectOne.id })
            await databaseConnection().getRepository('file').save(file)

            const projectVersion = createMockProjectVersion({ projectId: mockProjectOne.id, fileId: file.id, importedBy: mockUserOne.id })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-versions',
                body: {
                    fileId: file.id,
                    importedBy: mockUserOne.id,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json() as ProjectVersion
            expect(responseBody.id).toBeDefined()
            expect(responseBody.projectId).toBe(mockProjectOne.id)
            expect(responseBody.importedBy).toBe(mockUserOne.id)
            expect(responseBody.fileId).toBe(projectVersion.fileId)
            expect(responseBody.name).toBe(projectVersion.name)
            expect(responseBody.description).toBe(projectVersion.description)
        })
    })

    describe('Delete Project Version', () => {
        it('should delete a project version', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
                projectId: mockProjectOne.id,
            })

            const file = createMockFile({ platformId: mockPlatformOne.id, projectId: mockProjectOne.id })
            await databaseConnection().getRepository('file').save(file)

            const projectVersion = createMockProjectVersion({ projectId: mockProjectOne.id, fileId: file.id, importedBy: mockUserOne.id })
            await databaseConnection().getRepository('project_version').save(projectVersion)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-versions/${projectVersion.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const deletedProjectVersion = await databaseConnection().getRepository('project_version').findOne({ where: { id: projectVersion.id } })
            expect(deletedProjectVersion).toBeNull()
        })
    })
}) 