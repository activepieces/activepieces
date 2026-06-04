import { DefaultProjectRole, FieldType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createMockField, createMockRecord, createMockTable } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Record API — project-role permission enforcement', () => {
    describe('VIEWER (READ_TABLE only — no WRITE_TABLE)', () => {
        it('cannot create records (POST /v1/records → 403)', async () => {
            const { viewerCtx, table, field } = await setupViewer()

            const response = await viewerCtx.post('/v1/records', {
                tableId: table.id,
                records: [[{ fieldId: field.id, value: 'viewer-should-be-rejected' }]],
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('cannot update records (POST /v1/records/:id → 403)', async () => {
            const { viewerCtx, table, field, recordId } = await setupViewerWithRecord()

            const response = await viewerCtx.post(`/v1/records/${recordId}`, {
                tableId: table.id,
                cells: [{ fieldId: field.id, value: 'viewer-updated' }],
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('cannot delete records (DELETE /v1/records → 403)', async () => {
            const { viewerCtx, table, recordId } = await setupViewerWithRecord()

            const response = await viewerCtx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: { tableId: table.id, ids: [recordId] },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('can list records (GET /v1/records → 200)', async () => {
            const { viewerCtx, table } = await setupViewer()

            const response = await viewerCtx.get('/v1/records', { tableId: table.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('can read an individual record (GET /v1/records/:id → 200)', async () => {
            const { viewerCtx, recordId } = await setupViewerWithRecord()

            const response = await viewerCtx.get(`/v1/records/${recordId}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()?.id).toBe(recordId)
        })
    })

    describe('EDITOR (READ_TABLE + WRITE_TABLE) — fix must not block legitimate callers', () => {
        it('can create records', async () => {
            const { editorCtx, table, field } = await setupEditor()

            const response = await editorCtx.post('/v1/records', {
                tableId: table.id,
                records: [[{ fieldId: field.id, value: 'editor-allowed' }]],
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.length).toBe(1)
            expect(body[0].tableId).toBe(table.id)
        })

        it('can update records', async () => {
            const { editorCtx, table, field, recordId } = await setupEditorWithRecord()

            const response = await editorCtx.post(`/v1/records/${recordId}`, {
                tableId: table.id,
                cells: [{ fieldId: field.id, value: 'editor-updated' }],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('can delete records', async () => {
            const { editorCtx, table, recordId } = await setupEditorWithRecord()

            const response = await editorCtx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: { tableId: table.id, ids: [recordId] },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Project owner (ADMIN role on own project)', () => {
        it('can create, update, and delete records', async () => {
            const ownerCtx = await createTestContext(app, { plan: { projectRolesEnabled: true } })
            const { table, field } = await createTableWithField(ownerCtx)

            const createResp = await ownerCtx.post('/v1/records', {
                tableId: table.id,
                records: [[{ fieldId: field.id, value: 'owner-create' }]],
            })
            expect(createResp?.statusCode).toBe(StatusCodes.CREATED)

            const created = createResp?.json()
            const recordId = created[0].id

            const updateResp = await ownerCtx.post(`/v1/records/${recordId}`, {
                tableId: table.id,
                cells: [{ fieldId: field.id, value: 'owner-update' }],
            })
            expect(updateResp?.statusCode).toBe(StatusCodes.OK)

            const deleteResp = await ownerCtx.inject({
                method: 'DELETE',
                url: '/api/v1/records',
                body: { tableId: table.id, ids: [recordId] },
            })
            expect(deleteResp?.statusCode).toBe(StatusCodes.OK)
        })
    })
})

type TableAndField = { table: { id: string }, field: { id: string } }
type ViewerSetup = { ownerCtx: TestContext, viewerCtx: TestContext } & TableAndField
type EditorSetup = { ownerCtx: TestContext, editorCtx: TestContext } & TableAndField

async function setupViewer(): Promise<ViewerSetup> {
    const ownerCtx = await createTestContext(app, { plan: { projectRolesEnabled: true } })
    const viewerCtx = await createMemberContext(app, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
    const { table, field } = await createTableWithField(ownerCtx)
    return { ownerCtx, viewerCtx, table, field }
}

async function setupViewerWithRecord(): Promise<ViewerSetup & { recordId: string }> {
    const base = await setupViewer()
    const recordId = await createAndSaveRecord(base.table.id, base.ownerCtx.project.id)
    return { ...base, recordId }
}

async function setupEditor(): Promise<EditorSetup> {
    const ownerCtx = await createTestContext(app, { plan: { projectRolesEnabled: true } })
    const editorCtx = await createMemberContext(app, ownerCtx, { projectRole: DefaultProjectRole.EDITOR })
    const { table, field } = await createTableWithField(ownerCtx)
    return { ownerCtx, editorCtx, table, field }
}

async function setupEditorWithRecord(): Promise<EditorSetup & { recordId: string }> {
    const base = await setupEditor()
    const recordId = await createAndSaveRecord(base.table.id, base.ownerCtx.project.id)
    return { ...base, recordId }
}

async function createTableWithField(ctx: TestContext): Promise<TableAndField> {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
    field.type = FieldType.TEXT
    await db.save('field', field)
    return { table, field }
}

async function createAndSaveRecord(tableId: string, projectId: string): Promise<string> {
    const record = createMockRecord({ tableId, projectId })
    await db.save('record', record)
    return record.id
}
