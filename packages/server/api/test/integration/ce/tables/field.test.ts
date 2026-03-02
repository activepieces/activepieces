import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, FieldType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockField, createMockTable } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Field API', () => {
    describe('POST / (Create Field)', () => {
        it('should create a TEXT field', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.post('/v1/fields', {
                name: 'My Text Field',
                type: FieldType.TEXT,
                tableId: table.id,
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.name).toBe('My Text Field')
            expect(body.type).toBe(FieldType.TEXT)
            expect(body.tableId).toBe(table.id)
        })

        it('should create a STATIC_DROPDOWN field with options', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.post('/v1/fields', {
                name: 'Status',
                type: FieldType.STATIC_DROPDOWN,
                tableId: table.id,
                data: {
                    options: [{ value: 'Active' }, { value: 'Inactive' }],
                },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            expect(response.json().type).toBe(FieldType.STATIC_DROPDOWN)
        })

        it('should fail when tableId does not exist', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post('/v1/fields', {
                name: 'Orphan Field',
                type: FieldType.TEXT,
                tableId: apId(),
            })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET / (List Fields)', () => {
        it('should list fields for a table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field1 = createMockField({ tableId: table.id, projectId: ctx.project.id })
            const field2 = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', [field1, field2])

            const response = await ctx.get('/v1/fields', { tableId: table.id })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().length).toBe(2)
        })
    })

    describe('GET /:id (Get Field By ID)', () => {
        it('should return a field by id', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.get(`/v1/fields/${field.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(field.id)
            expect(response.json().name).toBe(field.name)
        })

        it('should return 404 for non-existent field', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/fields/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('POST /:id (Update Field)', () => {
        it('should update field name', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.post(`/v1/fields/${field.id}`, {
                name: 'Renamed Field',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().name).toBe('Renamed Field')
        })
    })

    describe('DELETE /:id (Delete Field)', () => {
        it('should delete a field', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.delete(`/v1/fields/${field.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)

            const deleted = await db.findOneBy('field', { id: field.id })
            expect(deleted).toBeNull()
        })

        it('should return 404 for non-existent field', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.delete(`/v1/fields/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
