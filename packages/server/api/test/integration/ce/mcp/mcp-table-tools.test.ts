import { apId } from '@activepieces/core-utils'
import { McpServerType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { apCreateTableTool } from '../../../../src/app/mcp/tools/ap-create-table'
import { apFindRecordsTool } from '../../../../src/app/mcp/tools/ap-find-records'
import { apInsertRecordsTool } from '../../../../src/app/mcp/tools/ap-insert-records'
import { apListTablesTool } from '../../../../src/app/mcp/tools/ap-list-tables'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP table tools', () => {
    it('ap_create_table coerces type spellings and returns field ids keyed by name', async () => {
        const mcp = await newMcp()
        const result = await apCreateTableTool(mcp, mockLog).execute({
            name: 'Leads',
            fields: [{ name: 'Name', type: 'text' }, { name: 'Age', type: 'Integer' }, { name: 'Stage', type: 'dropdown', options: ['new', 'won'] }],
        })
        const content = createdSchema.parse(result.structuredContent)
        expect(Object.keys(content.fieldIds).sort()).toEqual(['Age', 'Name', 'Stage'])
        expect(content.fields.find(f => f.name === 'Age')?.type).toBe('NUMBER')
        expect(content.fields.find(f => f.name === 'Stage')?.type).toBe('STATIC_DROPDOWN')
    })

    it('ap_create_table rejects an unknown type and lists the valid ones', async () => {
        const mcp = await newMcp()
        const result = await apCreateTableTool(mcp, mockLog).execute({ name: 'Bad', fields: [{ name: 'X', type: 'blob' }] })
        expect(text(result)).toContain('unknown type "blob"')
        expect(text(result)).toContain('TEXT, NUMBER')
    })

    it('ap_insert_records accepts names in any case, field ids and non-string values; rejects unknown names', async () => {
        const mcp = await newMcp()
        const created = createdSchema.parse((await apCreateTableTool(mcp, mockLog).execute({
            name: 'People',
            fields: [{ name: 'Name', type: 'TEXT' }, { name: 'Age', type: 'NUMBER' }],
        })).structuredContent)

        const inserted = await apInsertRecordsTool(mcp, mockLog).execute({
            tableId: created.id,
            records: [{ name: 'Alice', [created.fieldIds.Age]: 30 }, { NAME: 'Bob', age: '41' }],
        })
        expect(text(inserted)).toContain('Inserted 2 record(s)')

        const bad = await apInsertRecordsTool(mcp, mockLog).execute({ tableId: created.id, records: [{ Phone: '1' }] })
        expect(text(bad)).toContain('"Phone"')
        expect(text(bad)).toContain('Name (TEXT), Age (NUMBER)')

        const found = await apFindRecordsTool(mcp, mockLog).execute({ tableId: created.id, filters: [{ fieldName: 'name', operator: 'eq', value: 'Alice' }] })
        expect(text(found)).toContain('Age=30')
    })

    it('ap_find_records returns a small preview, says more match, and picks fields and truncated values', async () => {
        const mcp = await newMcp()
        const created = createdSchema.parse((await apCreateTableTool(mcp, mockLog).execute({
            name: 'Notes',
            fields: [{ name: 'Title', type: 'TEXT' }, { name: 'Body', type: 'TEXT' }],
        })).structuredContent)
        await apInsertRecordsTool(mcp, mockLog).execute({
            tableId: created.id,
            records: Array.from({ length: 15 }, (_, i) => ({ Title: `t${i}`, Body: 'x'.repeat(500) })),
        })

        const preview = findSchema.parse((await apFindRecordsTool(mcp, mockLog).execute({ tableId: created.id })).structuredContent)
        expect(preview.count).toBe(10)
        expect(preview.hasMore).toBe(true)
        expect(String(preview.records[0].cells.Body).length).toBeLessThan(300)

        const picked = findSchema.parse((await apFindRecordsTool(mcp, mockLog).execute({ tableId: created.id, fields: ['title'], limit: 3 })).structuredContent)
        expect(picked.count).toBe(3)
        expect(Object.keys(picked.records[0].cells)).toEqual(['Title'])

        const full = findSchema.parse((await apFindRecordsTool(mcp, mockLog).execute({ tableId: created.id, limit: 1, fullValues: true })).structuredContent)
        expect(String(full.records[0].cells.Body).length).toBe(500)
    })

    it('ap_list_tables is compact by default, filters by name, caps the listing and keeps detail opt-in', async () => {
        const mcp = await newMcp()
        for (let i = 0; i < 27; i++) {
            await apCreateTableTool(mcp, mockLog).execute({ name: `Table ${i}`, fields: [{ name: 'Name', type: 'TEXT' }] })
        }
        await apCreateTableTool(mcp, mockLog).execute({ name: 'Invoices', fields: [{ name: 'Amount', type: 'NUMBER' }] })

        const all = await apListTablesTool(mcp, mockLog).execute({})
        expect(listSchema.parse(all.structuredContent).count).toBe(25)
        expect(text(all)).toContain('3 more table(s) not shown. Narrow with name.')

        const filtered = await apListTablesTool(mcp, mockLog).execute({ name: 'invoi' })
        const filteredContent = listSchema.parse(filtered.structuredContent)
        expect(filteredContent.tables.map(t => t.name)).toEqual(['Invoices'])
        expect(filteredContent.tables[0].fields).toEqual([{ name: 'Amount', type: 'NUMBER' }])
        expect(text(filtered)).toContain('Amount:NUMBER')

        const detailed = await apListTablesTool(mcp, mockLog).execute({ name: 'Invoices', detailed: true })
        expect(listSchema.parse(detailed.structuredContent).tables[0].fields[0].id).toBeTruthy()
    })
})

async function newMcp(): Promise<ProjectScopedMcpServer> {
    const ctx = await createTestContext(app)
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId: ctx.project.id,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map(c => c.text).join('\n')
}

const createdSchema = z.object({
    id: z.string(),
    fieldIds: z.record(z.string(), z.string()),
    fields: z.array(z.object({ name: z.string(), type: z.string() })),
})

const findSchema = z.object({
    records: z.array(z.object({ id: z.string(), cells: z.record(z.string(), z.unknown()) })),
    count: z.number(),
    hasMore: z.boolean(),
})

const listSchema = z.object({
    tables: z.array(z.object({ name: z.string(), fields: z.array(z.object({ id: z.string().optional(), name: z.string(), type: z.string() })) })),
    count: z.number(),
})
