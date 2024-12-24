import { GitBranchType } from '@activepieces/ee-shared'
import { CreateProjectReleaseRequestBody, PrincipalType, ProjectReleaseType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { mockEnvironment } from '../../../helpers/mocks'

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
        it('should create a new project release with git repo', async () => {
            const { mockProject, mockOwner } = await mockEnvironment()

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@github.com:${faker.internet.userName()}/${faker.internet.userName()}.git`,
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

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()

            const requestProjectRelease: CreateProjectReleaseRequestBody = {
                name: 'test-name',
                description: 'test-description',
                type: ProjectReleaseType.GIT,
                selectedFlowsIds: [],
                repoId: responseBody.id,
            }

            const responseProjectRelease = await app?.inject({
                method: 'POST',
                url: '/v1/project-releases',
                payload: requestProjectRelease,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(responseProjectRelease?.statusCode).toBe(StatusCodes.CREATED)
            const responseProjectReleaseBody = responseProjectRelease?.json()
            expect(responseProjectReleaseBody.name).toBe(requestProjectRelease.name)
            expect(responseProjectReleaseBody.description).toBe(requestProjectRelease.description)
            expect(responseProjectReleaseBody.type).toBe(requestProjectRelease.type)
        })
    })
}) 