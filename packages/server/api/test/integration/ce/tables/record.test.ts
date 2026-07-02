import { apId } from '@activepieces/core-utils'
import { FieldType, FilterOperator, McpServerType, ProjectScopedMcpServer, TableColor } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import qs from 'qs'
import { apDeleteRecordsTool } from '../../../../src/app/mcp/tools/ap-delete-records'
import { apFindRecordsTool } from '../../../../src/app/mcp/tools/ap-find-records'
import { apUpdateRecordsTool } from '../../../../src/app/mcp/tools/ap-update-records'
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

function makeMcp(projectId: string): ProjectScopedMcpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

function toolText(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map((c) => c.text).join('\n')
}

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

    describeWithAuth('MCP record tools — accuracy signals', () => app!, (setup) => {
        it('ap_find_records reports total matching + hasMore when the page is capped', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const records = Array.from({ length: 3 }, () => createMockRecord({ tableId: table.id, projectId: ctx.project.id }))
            await db.save('record', records)

            const result = await apFindRecordsTool(makeMcp(ctx.project.id), app!.log).execute({ tableId: table.id, limit: 2 })

            expect(toolText(result)).toContain('Showing 2 of 3')
            expect(result.structuredContent).toMatchObject({ count: 2, totalMatching: 3, hasMore: true })
        })

        it('ap_find_records marks the result complete when nothing is truncated', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const records = Array.from({ length: 3 }, () => createMockRecord({ tableId: table.id, projectId: ctx.project.id }))
            await db.save('record', records)

            const result = await apFindRecordsTool(makeMcp(ctx.project.id), app!.log).execute({ tableId: table.id, limit: 50 })

            expect(toolText(result)).toContain('complete set')
            expect(result.structuredContent).toMatchObject({ count: 3, totalMatching: 3, hasMore: false })
        })

        it('ap_update_records reads the rows back and reports the verified split', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const records = Array.from({ length: 2 }, () => createMockRecord({ tableId: table.id, projectId: ctx.project.id }))
            await db.save('record', records)

            const result = await apUpdateRecordsTool(makeMcp(ctx.project.id), app!.log).execute({
                tableId: table.id,
                recordIds: records.map((r) => r.id),
                fields: { [field.name]: 'Closed' },
            })

            expect(toolText(result)).toContain('Updated 2 of 2')
            expect(toolText(result)).toContain('verified')
            expect(result.structuredContent).toMatchObject({ requested: 2, succeeded: 2, verified: 2, failed: 0 })
        })

        it('ap_delete_records reports deleted-of-requested and verifies', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const records = Array.from({ length: 2 }, () => createMockRecord({ tableId: table.id, projectId: ctx.project.id }))
            await db.save('record', records)

            const result = await apDeleteRecordsTool(makeMcp(ctx.project.id), app!.log).execute({
                tableId: table.id,
                recordIds: records.map((r) => r.id),
            })

            expect(toolText(result)).toContain('Deleted 2 of 2 requested')
            expect(result.structuredContent).toMatchObject({ requested: 2, deleted: 2, verified: true })
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

        it('should hide deleted records from listing (soft delete)', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            await ctx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: { tableId: table.id, ids: [record.id] },
            })

            const listResponse = await ctx.get(`/v1/records?${qs.stringify({ tableId: table.id })}`)
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(listResponse?.json().data.length).toBe(0)
        })
    })

    describeWithAuth('POST /v1/records/restore (Restore)', () => app!, (setup) => {
        it('should restore previously deleted records', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            cell.value = 'keep me'
            await db.save('cell', cell)

            await ctx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: { tableId: table.id, ids: [record.id] },
            })
            expect((await ctx.get(`/v1/records/${record.id}`))?.statusCode).toBe(StatusCodes.NOT_FOUND)

            const restoreResponse = await ctx.post('/v1/records/restore', {
                tableId: table.id,
                ids: [record.id],
            })

            expect(restoreResponse?.statusCode).toBe(StatusCodes.OK)
            const restored = restoreResponse?.json()
            expect(restored.length).toBe(1)
            expect(restored[0].id).toBe(record.id)

            const getResponse = await ctx.get(`/v1/records/${record.id}`)
            expect(getResponse?.statusCode).toBe(StatusCodes.OK)
            expect(getResponse?.json().cells[field.id].value).toBe('keep me')
        })
    })

    describeWithAuth('POST /v1/records/set-colors', () => app!, (setup) => {
        it('should set a row color on records', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                records: [{ recordId: record.id, color: TableColor.RED }],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.length).toBe(1)
            expect(body[0].id).toBe(record.id)
            expect(body[0].color).toBe(TableColor.RED)
        })

        it('should set a cell color without clobbering the cell value', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)
            const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId: ctx.project.id })
            cell.value = 'keep me'
            await db.save('cell', cell)

            const response = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                cells: [{ recordId: record.id, fieldId: field.id, color: TableColor.GREEN }],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body[0].cells[field.id].value).toBe('keep me')
            expect(body[0].cells[field.id].color).toBe(TableColor.GREEN)
        })

        it('should color an empty cell that has no row yet', async () => {
            const ctx = await setup()
            const { table, field } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                cells: [{ recordId: record.id, fieldId: field.id, color: TableColor.BLUE }],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body[0].cells[field.id].color).toBe(TableColor.BLUE)
        })

        it('should clear a row color when passed null', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                records: [{ recordId: record.id, color: TableColor.AMBER }],
            })
            const cleared = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                records: [{ recordId: record.id, color: null }],
            })

            expect(cleared?.statusCode).toBe(StatusCodes.OK)
            expect(cleared?.json()[0].color).toBeNull()
        })

        it('should ignore record ids that do not belong to the table', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                records: [
                    { recordId: record.id, color: TableColor.PURPLE },
                    { recordId: apId(), color: TableColor.PURPLE },
                ],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.length).toBe(1)
            expect(body[0].id).toBe(record.id)
        })

        it('should reject an out-of-palette color', async () => {
            const ctx = await setup()
            const { table } = await createTableWithField(ctx)
            const record = createMockRecord({ tableId: table.id, projectId: ctx.project.id })
            await db.save('record', record)

            const response = await ctx.post('/v1/records/set-colors', {
                tableId: table.id,
                records: [{ recordId: record.id, color: 'NEON' }],
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
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
