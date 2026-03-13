import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, FieldType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockField,
    createMockRecord,
    createMockCell,
    createMockTable,
} from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { describeWithAuth } from '../../../helpers/describe-with-auth'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Field API', () => {

    describeWithAuth('POST /v1/fields (Create)', () => app!, (setup) => {
        it('should create a TEXT field', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post('/v1/fields', {
                name: 'Text Field',
                type: FieldType.TEXT,
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.name).toBe('Text Field')
            expect(body.type).toBe(FieldType.TEXT)
            expect(body.tableId).toBe(table.id)
            expect(body.id).toBeDefined()
            expect(body.externalId).toBeDefined()
        })

        it('should create a NUMBER field', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post('/v1/fields', {
                name: 'Number Field',
                type: FieldType.NUMBER,
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.name).toBe('Number Field')
            expect(body.type).toBe(FieldType.NUMBER)
        })

        it('should create a DATE field', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post('/v1/fields', {
                name: 'Date Field',
                type: FieldType.DATE,
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.name).toBe('Date Field')
            expect(body.type).toBe(FieldType.DATE)
        })

        it('should create a STATIC_DROPDOWN field with options', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post('/v1/fields', {
                name: 'Dropdown Field',
                type: FieldType.STATIC_DROPDOWN,
                tableId: table.id,
                data: {
                    options: [
                        { value: 'Option A' },
                        { value: 'Option B' },
                    ],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.name).toBe('Dropdown Field')
            expect(body.type).toBe(FieldType.STATIC_DROPDOWN)
            expect(body.data.options).toEqual([
                { value: 'Option A' },
                { value: 'Option B' },
            ])
        })

        it('should create a field with custom externalId', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const externalId = apId()

            const response = await ctx.post('/v1/fields', {
                name: 'External Field',
                type: FieldType.TEXT,
                tableId: table.id,
                externalId,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.externalId).toBe(externalId)
        })
    })

    describeWithAuth('GET /v1/fields (List)', () => app!, (setup) => {
        it('should list all fields for a table', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field1 = createMockField({ tableId: table.id, projectId: ctx.project.id })
            const field2 = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', [field1, field2])

            const response = await ctx.get('/v1/fields', {
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.length).toBe(2)
        })

        it('should return empty array for table with no fields', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.get('/v1/fields', {
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.length).toBe(0)
        })
    })

    describeWithAuth('GET /v1/fields/:id (Get by ID)', () => app!, (setup) => {
        it('should return field by ID', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.get(`/v1/fields/${field.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(field.id)
            expect(body.name).toBe(field.name)
        })

        it('should return 404 for non-existent ID', async () => {
            const ctx = await setup()

            const response = await ctx.get(`/v1/fields/${apId()}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describeWithAuth('POST /v1/fields/:id (Update)', () => app!, (setup) => {
        it('should update field name', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.post(`/v1/fields/${field.id}`, {
                name: 'Updated Field Name',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('Updated Field Name')
            expect(body.id).toBe(field.id)
        })
    })

    describeWithAuth('DELETE /v1/fields/:id (Delete)', () => app!, (setup) => {
        it('should delete field', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.delete(`/v1/fields/${field.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const getResponse = await ctx.get(`/v1/fields/${field.id}`)
            expect(getResponse?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should cascade delete cells for that field', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            await ctx.delete(`/v1/fields/${field.id}`)

            const cellResult = await db.findOneBy('cell', { id: cell.id })
            expect(cellResult).toBeNull()
        })
    })
})

async function createAndSaveTable(ctx: TestContext) {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    return table
}
