import { apId } from '@activepieces/core-utils'
import { FieldType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { describeWithAuth } from '../../../helpers/describe-with-auth'
import {
    createMockCell,
    createMockField,
    createMockRecord,
    createMockTable,
} from '../../../helpers/mocks'
import { TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

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

    describeWithAuth('POST /v1/fields (Create) — position', () => app!, (setup) => {
        it('should append created fields with increasing positions', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const fields = await createFieldsInOrder(ctx, table.id, ['First', 'Second', 'Third'])

            expect(fields.map((f) => f.position)).toEqual([0, 1, 2])
        })

        it('should respect an explicit position on create', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post('/v1/fields', {
                name: 'Explicit',
                type: FieldType.TEXT,
                tableId: table.id,
                position: 7,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(response?.json().position).toBe(7)
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

    describeWithAuth('POST /v1/fields/reorder (Reorder)', () => app!, (setup) => {
        it('should reorder fields to the given order and resequence positions', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const fields = await createFieldsInOrder(ctx, table.id, ['A', 'B', 'C', 'D'])

            const response = await ctx.post('/v1/fields/reorder', {
                tableId: table.id,
                fieldIds: [fields[0].id, fields[3].id, fields[1].id, fields[2].id],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const listResponse = await ctx.get('/v1/fields', { tableId: table.id })
            const listed = listResponse?.json()
            expect(listed.map((f: { name: string }) => f.name)).toEqual(['A', 'D', 'B', 'C'])
            expect(listed.map((f: { position: number }) => f.position)).toEqual([0, 1, 2, 3])
        })

        it('should not touch fields of another table when a foreign id is passed', async () => {
            const ctx = await setup()
            const tableA = await createAndSaveTable(ctx)
            const fieldsA = await createFieldsInOrder(ctx, tableA.id, ['A', 'B'])
            const tableB = await createAndSaveTable(ctx)
            await createFieldsInOrder(ctx, tableB.id, ['X', 'Y'])
            const fieldsB = (await ctx.get('/v1/fields', { tableId: tableB.id }))?.json()

            const response = await ctx.post('/v1/fields/reorder', {
                tableId: tableA.id,
                fieldIds: [fieldsA[1].id, fieldsB[0].id, fieldsA[0].id],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const listedA = (await ctx.get('/v1/fields', { tableId: tableA.id }))?.json()
            expect(listedA.map((f: { name: string }) => f.name)).toEqual(['B', 'A'])

            const listedB = (await ctx.get('/v1/fields', { tableId: tableB.id }))?.json()
            expect(listedB.map((f: { name: string }) => f.name)).toEqual(['X', 'Y'])
            expect(listedB.map((f: { position: number }) => f.position)).toEqual([0, 1])
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

async function createFieldsInOrder(ctx: TestContext, tableId: string, names: string[]) {
    const fields = []
    for (const name of names) {
        const response = await ctx.post('/v1/fields', {
            name,
            type: FieldType.TEXT,
            tableId,
        })
        fields.push(response?.json())
    }
    return fields
}
