import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, FieldType, FilterOperator } from '@activepieces/shared'
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
import qs from 'qs'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Record API', () => {

    describeWithAuth('POST /v1/records (Create)', () => app!, (setup) => {
        it('should create a single record with cells', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [{ fieldId: field.id, value: 'hello' }],
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.length).toBe(1)
            expect(body[0].tableId).toBe(table.id)
            expect(body[0].cells[field.id]).toBeDefined()
            expect(body[0].cells[field.id].value).toBe('hello')
            expect(body[0].cells[field.id].fieldName).toBe(field.name)
        })

        it('should create multiple records in batch', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [{ fieldId: field.id, value: 'row1' }],
                    [{ fieldId: field.id, value: 'row2' }],
                    [{ fieldId: field.id, value: 'row3' }],
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.length).toBe(3)
        })

        it('should create a record with a numeric value coerced to string', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [{ fieldId: field.id, value: 0 }],
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body[0].cells[field.id].value).toBe('0')
        })

        it('should accept null value without coercing to "null" string', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [{ fieldId: field.id, value: null }],
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body[0].cells[field.id].value).toBe('')
        })

        it('should silently drop cells with non-existent fieldId', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [
                        { fieldId: field.id, value: 'valid' },
                        { fieldId: apId(), value: 'invalid' },
                    ],
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.length).toBe(1)
            expect(body[0].cells[field.id].value).toBe('valid')
        })
    })

    describeWithAuth('GET /v1/records (List)', () => app!, (setup) => {
        it('should list records for a table', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])

            const response = await ctx.get('/v1/records', {
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(2)
        })

        it('should respect limit parameter', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const records = Array.from({ length: 3 }, () =>
                createMockRecord({ tableId: table.id, projectId: ctx.project.id }),
            )
            await db.save('record', records)

            const response = await ctx.get('/v1/records', {
                tableId: table.id,
                limit: '2',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(2)
        })

        it('should return empty data for table with no records', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)

            const response = await ctx.get('/v1/records', {
                tableId: table.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(0)
        })
    })

    describeWithAuth('GET /v1/records/:id (Get by ID)', () => app!, (setup) => {
        it('should return populated record by ID', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            cell.value = 'cell-value'
            await db.save('cell', cell)

            const response = await ctx.get(`/v1/records/${record.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(record.id)
            expect(body.cells[field.id]).toBeDefined()
            expect(body.cells[field.id].value).toBe('cell-value')
            expect(body.cells[field.id].fieldName).toBe(field.name)
        })

        it('should return 404 for non-existent ID', async () => {
            const ctx = await setup()

            const response = await ctx.get(`/v1/records/${apId()}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describeWithAuth('POST /v1/records/:id (Update)', () => app!, (setup) => {
        it('should update cell value', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            cell.value = 'old-value'
            await db.save('cell', cell)

            const response = await ctx.post(`/v1/records/${record.id}`, {
                tableId: table.id,
                cells: [
                    { fieldId: field.id, value: 'new-value' },
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.cells[field.id].value).toBe('new-value')
        })

        it('should add new cell to existing record (upsert)', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const field2 = createMockField({ tableId: table.id, projectId: ctx.project.id })
            field2.type = FieldType.TEXT
            await db.save('field', field2)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.post(`/v1/records/${record.id}`, {
                tableId: table.id,
                cells: [
                    { fieldId: field2.id, value: 'new-cell-value' },
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.cells[field2.id].value).toBe('new-cell-value')
        })

        it('should return 404 for non-existent record', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)

            const response = await ctx.post(`/v1/records/${apId()}`, {
                tableId: table.id,
                cells: [],
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describeWithAuth('GET /v1/records (List with filters)', () => app!, (setup) => {
        it('EXISTS: should match record with non-empty cell', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])
            const cell1 = createMockCell({ recordId: record1.id, fieldId: field.id, projectId: ctx.project.id })
            cell1.value = 'hello'
            await db.save('cell', cell1)

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.EXISTS }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].id).toBe(record1.id)
        })

        it('EXISTS: should not match record with empty string cell', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record1)
            const cell1 = createMockCell({ recordId: record1.id, fieldId: field.id, projectId: ctx.project.id })
            cell1.value = ''
            await db.save('cell', cell1)

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.EXISTS }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(0)
        })

        it('NOT_EXISTS: should match record without a cell for the field', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])
            const cell2 = createMockCell({ recordId: record2.id, fieldId: field.id, projectId: ctx.project.id })
            cell2.value = 'hello'
            await db.save('cell', cell2)

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.NOT_EXISTS }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].id).toBe(record1.id)
        })

        it('NOT_EXISTS: should match record with empty string cell', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record1)
            const cell1 = createMockCell({ recordId: record1.id, fieldId: field.id, projectId: ctx.project.id })
            cell1.value = ''
            await db.save('cell', cell1)

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.NOT_EXISTS }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].id).toBe(record1.id)
        })

        it('NOT_EXISTS: should exclude record with non-empty cell', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record1)
            const cell1 = createMockCell({ recordId: record1.id, fieldId: field.id, projectId: ctx.project.id })
            cell1.value = 'filled'
            await db.save('cell', cell1)

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.NOT_EXISTS }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(0)
        })

        it('EQ: should match record with matching value', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])
            const cell1 = createMockCell({ recordId: record1.id, fieldId: field.id, projectId: ctx.project.id })
            cell1.value = 'target'
            const cell2 = createMockCell({ recordId: record2.id, fieldId: field.id, projectId: ctx.project.id })
            cell2.value = 'other'
            await db.save('cell', [cell1, cell2])

            const response = await ctx.inject({
                method: 'GET',
                url: `/api/v1/records?${qs.stringify({ tableId: table.id, filters: [{ fieldId: field.id, operator: FilterOperator.EQ, value: 'target' }] })}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].id).toBe(record1.id)
        })
    })

    describeWithAuth('DELETE /v1/records (Delete)', () => app!, (setup) => {
        it('should delete records by IDs', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: {
                    tableId: table.id,
                    ids: [record.id],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const getResponse = await ctx.get(`/v1/records/${record.id}`)
            expect(getResponse?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should return 404 when record does not exist', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)

            const response = await ctx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: {
                    tableId: table.id,
                    ids: [apId()],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})

async function createTableWithField(ctx: TestContext) {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
    field.type = FieldType.TEXT
    await db.save('field', field)
    return { table, field }
}
