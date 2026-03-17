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

describe('Table API', () => {

    describeWithAuth('POST /v1/tables (Create)', () => app!, (setup) => {
        it('should create a table with name', async () => {
            const ctx = await setup()

            const response = await ctx.post('/v1/tables', {
                projectId: ctx.project.id,
                name: 'My Table',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('My Table')
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.id).toBeDefined()
            expect(body.externalId).toBeDefined()
        })

        it('should create a table with initial fields', async () => {
            const ctx = await setup()
            const nameExtId = apId()
            const ageExtId = apId()

            const response = await ctx.post('/v1/tables', {
                projectId: ctx.project.id,
                name: 'Table With Fields',
                fields: [
                    { name: 'Name', type: FieldType.TEXT, data: null, externalId: nameExtId },
                    { name: 'Age', type: FieldType.NUMBER, data: null, externalId: ageExtId },
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('Table With Fields')

            const fieldsResponse = await ctx.get('/v1/fields', {
                tableId: body.id,
            })
            const fields = fieldsResponse?.json()
            expect(fields.length).toBe(2)
            expect(fields.map((f: { name: string }) => f.name).sort()).toEqual(['Age', 'Name'])
        })

        it('should create a table with externalId', async () => {
            const ctx = await setup()
            const externalId = apId()

            const response = await ctx.post('/v1/tables', {
                projectId: ctx.project.id,
                name: 'External Table',
                externalId,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.externalId).toBe(externalId)
        })
    })

    describeWithAuth('POST /v1/tables/:id (Update)', () => app!, (setup) => {
        it('should update table name', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.post(`/v1/tables/${table.id}`, {
                name: 'Updated Name',
                folderId: null,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('Updated Name')
        })

        it('should return 404 for non-existent table', async () => {
            const ctx = await setup()

            const response = await ctx.post(`/v1/tables/${apId()}`, {
                name: 'Updated Name',
                folderId: null,
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describeWithAuth('GET /v1/tables (List)', () => app!, (setup) => {
        it('should list tables for project', async () => {
            const ctx = await setup()
            await createAndSaveTable(ctx)
            await createAndSaveTable(ctx)

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(2)
        })

        it('should filter by name', async () => {
            const ctx = await setup()
            const table = createMockTable({ projectId: ctx.project.id })
            table.name = 'UniqueSearchName'
            await db.save('table', table)
            await createAndSaveTable(ctx)

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
                name: 'UniqueSearchName',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].name).toBe('UniqueSearchName')
        })

        it('should respect limit parameter', async () => {
            const ctx = await setup()
            await createAndSaveTable(ctx)
            await createAndSaveTable(ctx)
            await createAndSaveTable(ctx)

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
                limit: '2',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(2)
        })
    })

    describe('GET /v1/tables/count', () => {
        it('should return correct count of tables', async () => {
            const ctx = await createTestContext(app!)
            await createAndSaveTable(ctx)
            await createAndSaveTable(ctx)

            const response = await ctx.get('/v1/tables/count', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toBe(2)
        })

        it('should return 0 for project with no tables', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/tables/count', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toBe(0)
        })
    })

    describeWithAuth('GET /v1/tables/:id (Get by ID)', () => app!, (setup) => {
        it('should return table by ID', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.get(`/v1/tables/${table.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(table.id)
            expect(body.name).toBe(table.name)
        })

        it('should return 404 for non-existent ID', async () => {
            const ctx = await setup()

            const response = await ctx.get(`/v1/tables/${apId()}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not access table from another project', async () => {
            const ctx = await setup()
            const otherCtx = await createTestContext(app!)
            const otherTable = await createAndSaveTable(otherCtx)

            const response = await ctx.get(`/v1/tables/${otherTable.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describeWithAuth('DELETE /v1/tables/:id (Delete)', () => app!, (setup) => {
        it('should delete table', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)

            const response = await ctx.delete(`/v1/tables/${table.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const getResponse = await ctx.get(`/v1/tables/${table.id}`)
            expect(getResponse?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should cascade delete fields, records, and cells', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.delete(`/v1/tables/${table.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const fieldResult = await db.findOneBy('field', { id: field.id })
            expect(fieldResult).toBeNull()
            const recordResult = await db.findOneBy('record', { id: record.id })
            expect(recordResult).toBeNull()
            const cellResult = await db.findOneBy('cell', { id: cell.id })
            expect(cellResult).toBeNull()
        })
    })

    describeWithAuth('GET /v1/tables/:id/export (Export)', () => app!, (setup) => {
        it('should export table with fields and rows', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            field.type = FieldType.TEXT
            await db.save('field', field)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            cell.value = 'test-value'
            await db.save('cell', cell)

            const response = await ctx.get(`/v1/tables/${table.id}/export`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe(table.name)
            expect(body.fields.length).toBe(1)
            expect(body.fields[0].name).toBe(field.name)
            expect(body.rows.length).toBe(1)
            expect(body.rows[0][field.name]).toBe('test-value')
        })

        it('should export empty table with fields but no rows', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            field.type = FieldType.TEXT
            await db.save('field', field)

            const response = await ctx.get(`/v1/tables/${table.id}/export`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.fields.length).toBe(1)
            expect(body.rows.length).toBe(0)
        })
    })

    describeWithAuth('POST /v1/tables/:id/clear (Clear)', () => app!, (setup) => {
        it('should clear all records', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.post(`/v1/tables/${table.id}/clear`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('should keep table and fields after clear', async () => {
            const ctx = await setup()
            const table = await createAndSaveTable(ctx)
            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            await ctx.post(`/v1/tables/${table.id}/clear`)

            const tableResponse = await ctx.get(`/v1/tables/${table.id}`)
            expect(tableResponse?.statusCode).toBe(StatusCodes.OK)

            const fieldsResponse = await ctx.get('/v1/fields', { tableId: table.id })
            expect(fieldsResponse?.json().length).toBe(1)

            const recordsResponse = await ctx.get('/v1/records', { tableId: table.id })
            expect(recordsResponse?.json().data.length).toBe(0)
        })
    })
})

async function createAndSaveTable(ctx: TestContext) {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    return table
}
