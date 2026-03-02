import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFolder } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Folder API', () => {
    describe('POST / (Create Folder)', () => {
        it('should create a folder', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post('/v1/folders', {
                displayName: 'Test Folder',
                projectId: ctx.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.displayName).toBe('Test Folder')
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.id).toBeDefined()
        })
    })

    describe('POST /:id (Update Folder)', () => {
        it('should update folder display name', async () => {
            const ctx = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folder)

            const response = await ctx.post(`/v1/folders/${folder.id}`, {
                displayName: 'Updated Name',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().displayName).toBe('Updated Name')
        })

        it('should return 404 for non-existent folder', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post(`/v1/folders/${apId()}`, {
                displayName: 'Updated',
            })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not update folder from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx1.project.id })
            await db.save('folder', folder)

            const response = await ctx2.post(`/v1/folders/${folder.id}`, {
                displayName: 'Hijacked',
            })
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET /:id (Get Folder)', () => {
        it('should return a folder by id', async () => {
            const ctx = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folder)

            const response = await ctx.get(`/v1/folders/${folder.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(folder.id)
            expect(response.json().displayName).toBe(folder.displayName)
        })

        it('should return 404 for non-existent folder', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/folders/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not return folder from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx1.project.id })
            await db.save('folder', folder)

            const response = await ctx2.get(`/v1/folders/${folder.id}`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET / (List Folders)', () => {
        it('should list folders for the project', async () => {
            const ctx = await createTestContext(app!)
            const folder1 = createMockFolder({ projectId: ctx.project.id })
            const folder2 = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', [folder1, folder2])

            const response = await ctx.get('/v1/folders', {
                projectId: ctx.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(2)
        })

        it('should return empty when no folders exist', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/folders', {
                projectId: ctx.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(0)
        })

        it('should not list folders from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx1.project.id })
            await db.save('folder', folder)

            const response = await ctx2.get('/v1/folders', {
                projectId: ctx2.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(0)
        })
    })

    describe('DELETE /:id (Delete Folder)', () => {
        it('should delete a folder', async () => {
            const ctx = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folder)

            const response = await ctx.delete(`/v1/folders/${folder.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)

            const deleted = await db.findOneBy('folder', { id: folder.id })
            expect(deleted).toBeNull()
        })

        it('should return 404 for non-existent folder', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.delete(`/v1/folders/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not delete folder from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const folder = createMockFolder({ projectId: ctx1.project.id })
            await db.save('folder', folder)

            const response = await ctx2.delete(`/v1/folders/${folder.id}`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
