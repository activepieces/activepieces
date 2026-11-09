import { apId } from '@activepieces/core-utils'
import { McpServerType, ProjectScopedMcpServer, TableRecordsChangeOp, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { websocketService } from '../../../../src/app/core/websockets.service'
import { apCreateTableTool } from '../../../../src/app/mcp/tools/ap-create-table'
import { apDeleteRecordsTool } from '../../../../src/app/mcp/tools/ap-delete-records'
import { apInsertRecordsTool } from '../../../../src/app/mcp/tools/ap-insert-records'
import { apManageFieldsTool } from '../../../../src/app/mcp/tools/ap-manage-fields'
import { apUpdateRecordTool } from '../../../../src/app/mcp/tools/ap-update-record'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('MCP table tools push changes to the table room', () => {
    it('sends inserted, updated and deleted rows to the table room only', async () => {
        const { mcp, tableId } = await setup()
        const pushes = capturePushes()

        const inserted = await apInsertRecordsTool(mcp, app.log).execute({ tableId, records: [{ Name: 'Alice' }] })
        const recordId = onlyRecordId({ pushes })
        await apUpdateRecordTool(mcp, app.log).execute({ tableId, recordId, fields: { Name: 'Bob' } })
        await apDeleteRecordsTool(mcp, app.log).execute({ tableId, recordIds: [recordId] })

        expect(inserted.isError).toBeFalsy()
        expect(pushes.map(({ room, payload }) => ({ room, op: payload.op, editorSessionId: payload.editorSessionId }))).toEqual([
            { room: `table:${tableId}`, op: TableRecordsChangeOp.CREATED, editorSessionId: null },
            { room: `table:${tableId}`, op: TableRecordsChangeOp.UPDATED, editorSessionId: null },
            { room: `table:${tableId}`, op: TableRecordsChangeOp.DELETED, editorSessionId: null },
        ])
        expect(pushes[2].payload).toMatchObject({ recordIds: [recordId] })
    })

    it('tells the table room that the fields changed when the AI adds a column', async () => {
        const { mcp, tableId } = await setup()
        const pushes = capturePushes()

        await apManageFieldsTool(mcp, app.log).execute({ tableId, operation: 'ADD', name: 'Score', type: 'TEXT' })

        expect(pushes).toEqual([
            { room: `table:${tableId}`, payload: { tableId, editorSessionId: null, op: TableRecordsChangeOp.FIELDS_CHANGED } },
        ])
    })
})

async function setup(): Promise<{ mcp: ProjectScopedMcpServer, tableId: string }> {
    const ctx = await createTestContext(app)
    const mcp: ProjectScopedMcpServer = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId: ctx.project.id,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
    const created = await apCreateTableTool(mcp, app.log).execute({ name: 'Leads', fields: [{ name: 'Name', type: 'TEXT' }] })
    const tableId = z.object({ id: z.string() }).parse(created.structuredContent).id
    return { mcp, tableId }
}

function onlyRecordId({ pushes }: { pushes: Push[] }): string {
    const created = z.object({ records: z.array(z.object({ id: z.string() })).length(1) }).parse(pushes[0].payload)
    return created.records[0].id
}

function capturePushes(): Push[] {
    const pushes: Push[] = []
    const realTo = websocketService.to
    vi.spyOn(websocketService, 'to').mockImplementation((room) => {
        const operator = realTo(room)
        vi.spyOn(operator, 'emit').mockImplementation((event, ...args) => {
            if (event === WebsocketClientEvent.TABLE_RECORDS_CHANGED) {
                pushes.push({ room, payload: z.object({ op: z.string(), editorSessionId: z.string().nullable() }).passthrough().parse(args[0]) })
            }
            return true
        })
        return operator
    })
    return pushes
}

type Push = {
    room: string
    payload: { op: string, editorSessionId: string | null } & Record<string, unknown>
}
