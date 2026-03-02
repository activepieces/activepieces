import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    CreateProjectReleaseRequestBody,
    PopulatedFlow,
    ProjectReleaseType,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    createMockFile,
    createMockProjectRelease,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project Release API', () => {
    describe('POST /v1/project-releases (Create)', () => {
        it('should fail if projectId does not match', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const apiKey = createMockApiKey({
                platformId: mockPlatform.id,
            })
            await db.save('api_key', apiKey)

            const request: CreateProjectReleaseRequestBody = {
                name: faker.animal.bird(),
                description: faker.lorem.sentence(),
                selectedFlowsIds: [],
                projectId: faker.string.uuid(),
                type: ProjectReleaseType.GIT,
            }

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-releases',
                body: request,
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should create a PROJECT type release', async () => {
            const sourceCtx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })
            const targetCtx = await createTestContext(app!, {
                platform: { ownerId: sourceCtx.user.id },
                project: { releasesEnabled: true },
            })

            // Create a flow in the source project
            await sourceCtx.post('/v1/flows', {
                displayName: 'Source Flow',
                projectId: sourceCtx.project.id,
            }, { query: { projectId: sourceCtx.project.id } })

            const response = await targetCtx.post('/v1/project-releases', {
                name: 'Test Release',
                description: 'A test release',
                selectedFlowsIds: null,
                projectId: targetCtx.project.id,
                type: ProjectReleaseType.PROJECT,
                targetProjectId: sourceCtx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('GET /v1/project-releases (List)', () => {
        it('should list releases for project', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })

            const mockFile = createMockFile({
                platformId: ctx.platform.id,
                projectId: ctx.project.id,
            })
            await db.save('file', mockFile)

            const mockRelease = createMockProjectRelease({
                projectId: ctx.project.id,
                importedBy: ctx.user.id,
                fileId: mockFile.id,
                type: ProjectReleaseType.GIT,
            })
            await db.save('project_release', mockRelease)

            const response = await ctx.get('/v1/project-releases', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(1)
        })

        it('should return empty list for project with no releases', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })

            const response = await ctx.get('/v1/project-releases', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(0)
        })

        it('should support pagination', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })

            for (let i = 0; i < 3; i++) {
                const mockFile = createMockFile({
                    platformId: ctx.platform.id,
                    projectId: ctx.project.id,
                })
                await db.save('file', mockFile)

                const mockRelease = createMockProjectRelease({
                    projectId: ctx.project.id,
                    importedBy: ctx.user.id,
                    fileId: mockFile.id,
                    type: ProjectReleaseType.GIT,
                })
                await db.save('project_release', mockRelease)
            }

            const response = await ctx.get('/v1/project-releases', {
                projectId: ctx.project.id,
                limit: '2',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeLessThanOrEqual(2)
        })
    })

    describe('GET /v1/project-releases/:id', () => {
        it('should get release by id', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })

            const mockFile = createMockFile({
                platformId: ctx.platform.id,
                projectId: ctx.project.id,
            })
            await db.save('file', mockFile)

            const mockRelease = createMockProjectRelease({
                projectId: ctx.project.id,
                importedBy: ctx.user.id,
                fileId: mockFile.id,
                type: ProjectReleaseType.GIT,
            })
            await db.save('project_release', mockRelease)

            const response = await ctx.get(`/v1/project-releases/${mockRelease.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(mockRelease.id)
            expect(body.name).toBe(mockRelease.name)
        })

        it('should return 404 for non-existent release', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })
            const nonExistentId = apId()

            const response = await ctx.get(`/v1/project-releases/${nonExistentId}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Auth', () => {
        it('should deny cross-project access', async () => {
            const ctx1 = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })
            const ctx2 = await createTestContext(app!, {
                project: { releasesEnabled: true },
            })

            const mockFile = createMockFile({
                platformId: ctx1.platform.id,
                projectId: ctx1.project.id,
            })
            await db.save('file', mockFile)

            const mockRelease = createMockProjectRelease({
                projectId: ctx1.project.id,
                importedBy: ctx1.user.id,
                fileId: mockFile.id,
                type: ProjectReleaseType.GIT,
            })
            await db.save('project_release', mockRelease)

            const response = await ctx2.get(`/v1/project-releases/${mockRelease.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
