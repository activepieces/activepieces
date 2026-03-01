import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, FieldType, TableWebhookEventType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockField,
    createMockFlow,
    createMockRecord,
    createMockCell,
    createMockTable,
    createMockTableWebhook,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Table API', () => {
    describe('POST / (Create Table)', () => {
        it('should create a table with name', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post('/v1/tables', {
                projectId: ctx.project.id,
                name: 'Test Table',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.name).toBe('Test Table')
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.id).toBeDefined()
        })

        it('should create a table with externalId', async () => {
            const ctx = await createTestContext(app!)
            const externalId = apId()
            const response = await ctx.post('/v1/tables', {
                projectId: ctx.project.id,
                name: 'External Table',
                externalId,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().externalId).toBe(externalId)
        })
    })

    describe('POST /:id (Update Table)', () => {
        it('should update table name', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.post(`/v1/tables/${table.id}`, {
                name: 'Updated Table',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().name).toBe('Updated Table')
        })

        it('should return 404 for non-existent table', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.post(`/v1/tables/${apId()}`, {
                name: 'Nope',
            })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not allow updating table from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx1.project.id })
            await db.save('table', table)

            const response = await ctx2.post(`/v1/tables/${table.id}`, {
                name: 'Hijacked',
            })
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET / (List Tables)', () => {
        it('should list tables for the project', async () => {
            const ctx = await createTestContext(app!)
            const table1 = createMockTable({ projectId: ctx.project.id })
            const table2 = createMockTable({ projectId: ctx.project.id })
            await db.save('table', [table1, table2])

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(2)
        })

        it('should filter tables by name', async () => {
            const ctx = await createTestContext(app!)
            const table1 = createMockTable({ projectId: ctx.project.id })
            table1.name = 'UniqueSearchName'
            const table2 = createMockTable({ projectId: ctx.project.id })
            await db.save('table', [table1, table2])

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
                name: 'UniqueSearchName',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(1)
            expect(response.json().data[0].name).toBe('UniqueSearchName')
        })

        it('should not list tables from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx1.project.id })
            await db.save('table', table)

            const response = await ctx2.get('/v1/tables', {
                projectId: ctx2.project.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data.length).toBe(0)
        })
    })

    describe('GET /:id (Get Table By ID)', () => {
        it('should return a table by id', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.get(`/v1/tables/${table.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(table.id)
            expect(response.json().name).toBe(table.name)
        })

        it('should return 404 for non-existent table', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/tables/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET /:id/export (Export Table)', () => {
        it('should export table with fields and rows', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.get(`/v1/tables/${table.id}/export`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.name).toBe(table.name)
            expect(body.fields.length).toBe(1)
            expect(body.rows.length).toBe(1)
        })

        it('should export empty table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const response = await ctx.get(`/v1/tables/${table.id}/export`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.rows.length).toBe(0)
        })
    })

    describe('DELETE /:id (Delete Table)', () => {
        it('should delete a table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.delete(`/v1/tables/${table.id}`)
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)

            const deleted = await db.findOneBy('table', { id: table.id })
            expect(deleted).toBeNull()
        })

        it('should return 404 for non-existent table', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.delete(`/v1/tables/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('POST /:id/webhooks (Create Table Webhook)', () => {
        it('should create a webhook for a table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const flow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', flow)

            const response = await ctx.post(`/v1/tables/${table.id}/webhooks`, {
                events: [TableWebhookEventType.RECORD_CREATED],
                webhookUrl: 'https://example.com/webhook',
                flowId: flow.id,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().tableId).toBe(table.id)
        })
    })

    describe('DELETE /:id/webhooks/:webhookId (Delete Table Webhook)', () => {
        it('should delete a webhook', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const flow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', flow)

            const webhook = createMockTableWebhook({
                tableId: table.id,
                projectId: ctx.project.id,
                flowId: flow.id,
            })
            await db.save('table_webhook', webhook)

            const response = await ctx.delete(`/v1/tables/${table.id}/webhooks/${webhook.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('POST /:id/clear (Clear Table Records)', () => {
        it('should clear all records from a table', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
            await db.save('field', field)

            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            await db.save('cell', cell)

            const response = await ctx.post(`/v1/tables/${table.id}/clear`)
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)

            const remainingRecord = await db.findOneBy('record', { tableId: table.id })
            expect(remainingRecord).toBeNull()
        })

        it('should succeed on table with no records', async () => {
            const ctx = await createTestContext(app!)
            const table = createMockTable({ projectId: ctx.project.id })
            await db.save('table', table)

            const response = await ctx.post(`/v1/tables/${table.id}/clear`)
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })
})
