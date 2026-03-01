import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockCell,
    createMockField,
    createMockRecord,
    createMockTable,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Record API', () => {
    describe('POST / (Create Records)', () => {
        it('should create a single record with cells', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [[{ fieldId: field.id, value: 'hello' }]],
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.length).toBe(1)
            expect(body[0].cells).toBeDefined()
        })

        it('should create multiple records at once', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.post('/v1/records', {
                tableId: table.id,
                records: [
                    [{ fieldId: field.id, value: 'row1' }],
                    [{ fieldId: field.id, value: 'row2' }],
                ],
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            expect(response.json().length).toBe(2)
        })

        it('should fail when tableId does not exist', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post('/v1/records', {
                tableId: apId(),
                records: [[{ fieldId: apId(), value: 'test' }]],
            })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET /:id (Get Record By ID)', () => {
        it('should return a record with populated cells', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.get(`/v1/records/${record.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(record.id)
            expect(response.json().cells).toBeDefined()
        })

        it('should return 404 for non-existent record', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/records/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('POST /:id (Update Record)', () => {
        it('should update record cells', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.post(`/v1/records/${record.id}`, {
                tableId: table.id,
                cells: [{ fieldId: field.id, value: 'updated value' }],
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const cells = response.json().cells
            expect(cells[field.id].value).toBe('updated value')
        })
    })

    describe('DELETE / (Delete Records)', () => {
        it('should delete records by ids', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])

            const response = await ctx.inject({
                method: 'DELETE',
                url: '/v1/records',
                body: {
                    tableId: table.id,
                    ids: [record1.id, record2.id],
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)

            const remaining1 = await db.findOneBy('record', { id: record1.id })
            const remaining2 = await db.findOneBy('record', { id: record2.id })
            expect(remaining1).toBeNull()
            expect(remaining2).toBeNull()
        })
    })

    describe('GET / (List Records)', () => {
        it('should list records for a table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const record1 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            const record2 = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', [record1, record2])

            const response = await ctx.get('/v1/records', { tableId: table.id })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(2)
        })

        it('should paginate records', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const records = Array.from({ length: 3 }, () =>
                createMockRecord({ tableId: table.id, projectId: ctx.project.id }),
            )
            await db.save('record', records)

            const response = await ctx.get('/v1/records', {
                tableId: table.id,
                limit: '2',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(2)
            expect(response.json().next).toBeDefined()
        })
    })
})
