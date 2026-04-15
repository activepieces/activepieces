import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    CreateProjectReleaseRequestBody,
    ProjectReleaseType,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    createMockFile,
    createMockProject,
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
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: { environmentsEnabled: true },
            })
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
                url: '/api/v1/project-releases',
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
                plan: { environmentsEnabled: true },
            })

            const mockSourceProject = createMockProject({
                platformId: sourceCtx.platform.id,
                ownerId: sourceCtx.user.id,
                releasesEnabled: true,
            })
            await db.save('project', mockSourceProject)

            // Create a flow in the source project
            await sourceCtx.post('/v1/flows', {
                displayName: 'Source Flow',
                projectId: mockSourceProject.id,
            }, { query: { projectId: mockSourceProject.id } })

            const response = await sourceCtx.post('/v1/project-releases', {
                name: 'Test Release',
                description: 'A test release',
                selectedFlowsIds: null,
                projectId: sourceCtx.project.id,
                type: ProjectReleaseType.PROJECT,
                targetProjectId: mockSourceProject.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('GET /v1/project-releases (List)', () => {
        it('should list releases for project', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
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
                plan: { environmentsEnabled: true },
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
                plan: { environmentsEnabled: true },
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
                plan: { environmentsEnabled: true },
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
                plan: { environmentsEnabled: true },
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
                plan: { environmentsEnabled: true },
            })
            const ctx2 = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
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

        it('should reject when environmentsEnabled is false', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: false },
            })

            const response = await ctx.get('/v1/project-releases', {
                projectId: ctx.project.id,
            })

            // FEATURE_DISABLED maps to PAYMENT_REQUIRED (402)
            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })

        it('should reject create with targetProjectId from a different platform', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
            })

            const otherPlatformCtx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
            })

            const response = await ctx.post('/v1/project-releases', {
                name: 'IDOR Attempt',
                description: 'Should fail',
                selectedFlowsIds: null,
                projectId: ctx.project.id,
                type: ProjectReleaseType.PROJECT,
                targetProjectId: otherPlatformCtx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should reject diff with targetProjectId from a different platform', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
            })

            const otherPlatformCtx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
            })

            const response = await ctx.post('/v1/project-releases/diff', {
                projectId: ctx.project.id,
                type: ProjectReleaseType.PROJECT,
                targetProjectId: otherPlatformCtx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should reject create with non-existent targetProjectId', async () => {
            const ctx = await createTestContext(app!, {
                project: { releasesEnabled: true },
                plan: { environmentsEnabled: true },
            })

            const response = await ctx.post('/v1/project-releases', {
                name: 'Non-existent target',
                description: 'Should fail',
                selectedFlowsIds: null,
                projectId: ctx.project.id,
                type: ProjectReleaseType.PROJECT,
                targetProjectId: apId(),
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
