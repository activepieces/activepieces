import { DefaultProjectRole, FieldType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createMockField, createMockTable } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Field API — project-role permission enforcement', () => {
    describe('VIEWER (READ_TABLE only — no WRITE_TABLE)', () => {
        it('cannot create fields (POST /v1/fields → 403)', async () => {
            const { viewerCtx, table } = await setupViewer()

            const response = await viewerCtx.post('/v1/fields', {
                tableId: table.id,
                name: 'viewer-should-be-rejected',
                type: FieldType.TEXT,
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('cannot update fields (POST /v1/fields/:id → 403)', async () => {
            const { viewerCtx, field } = await setupViewer()

            const response = await viewerCtx.post(`/v1/fields/${field.id}`, {
                name: 'viewer-renamed',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('cannot delete fields (DELETE /v1/fields/:id → 403)', async () => {
            const { viewerCtx, field } = await setupViewer()

            const response = await viewerCtx.inject({
                method: 'DELETE',
                url: `/api/v1/fields/${field.id}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toMatchObject({ code: 'PERMISSION_DENIED' })
        })

        it('can list fields (GET /v1/fields → 200)', async () => {
            const { viewerCtx, table } = await setupViewer()

            const response = await viewerCtx.get('/v1/fields', { tableId: table.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('can read an individual field (GET /v1/fields/:id → 200)', async () => {
            const { viewerCtx, field } = await setupViewer()

            const response = await viewerCtx.get(`/v1/fields/${field.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()?.id).toBe(field.id)
        })
    })

    describe('EDITOR (READ_TABLE + WRITE_TABLE) — fix must not block legitimate callers', () => {
        it('can create fields', async () => {
            const { editorCtx, table } = await setupEditor()

            const response = await editorCtx.post('/v1/fields', {
                tableId: table.id,
                name: 'editor-allowed',
                type: FieldType.TEXT,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(response?.json()?.tableId).toBe(table.id)
        })

        it('can update fields', async () => {
            const { editorCtx, field } = await setupEditor()

            const response = await editorCtx.post(`/v1/fields/${field.id}`, {
                name: 'editor-renamed',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()?.name).toBe('editor-renamed')
        })

        it('can delete fields', async () => {
            const { editorCtx, field } = await setupEditor()

            const response = await editorCtx.inject({
                method: 'DELETE',
                url: `/api/v1/fields/${field.id}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Project owner (ADMIN role on own project)', () => {
        it('can create, update, and delete fields', async () => {
            const ownerCtx = await createTestContext(app, { plan: { projectRolesEnabled: true } })
            const { table } = await createTableWithField(ownerCtx)

            const createResp = await ownerCtx.post('/v1/fields', {
                tableId: table.id,
                name: 'owner-create',
                type: FieldType.TEXT,
            })
            expect(createResp?.statusCode).toBe(StatusCodes.CREATED)

            const fieldId = createResp?.json()?.id

            const updateResp = await ownerCtx.post(`/v1/fields/${fieldId}`, {
                name: 'owner-update',
            })
            expect(updateResp?.statusCode).toBe(StatusCodes.OK)

            const deleteResp = await ownerCtx.inject({
                method: 'DELETE',
                url: `/api/v1/fields/${fieldId}`,
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

async function setupEditor(): Promise<EditorSetup> {
    const ownerCtx = await createTestContext(app, { plan: { projectRolesEnabled: true } })
    const editorCtx = await createMemberContext(app, ownerCtx, { projectRole: DefaultProjectRole.EDITOR })
    const { table, field } = await createTableWithField(ownerCtx)
    return { ownerCtx, editorCtx, table, field }
}

async function createTableWithField(ctx: TestContext): Promise<TableAndField> {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
    field.type = FieldType.TEXT
    await db.save('field', field)
    return { table, field }
}
