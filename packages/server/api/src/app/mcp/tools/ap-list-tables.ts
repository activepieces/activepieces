import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { mcpUtils } from './mcp-utils'
import { formatFieldInfo } from './table-utils'

const DISPLAY_CAP = 25
const FETCH_LIMIT = 200

const listTablesInput = z.object({
    name: z.string().optional().describe('Only tables whose name contains this text (case-insensitive)'),
    detailed: z.boolean().optional().describe('Include field ids, externalIds and dropdown options'),
})

export const apListTablesTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_tables',
        permission: Permission.READ_TABLE,
        description: `List tables in the project: name, id, externalId, row count and field names with types. Filter with name (case-insensitive contains). Shows up to ${DISPLAY_CAP}. Pass detailed: true for field ids/externalIds and dropdown options. Use "id" with the record/field MCP tools; use "externalId" as table_id in a Tables piece step.`,
        inputSchema: listTablesInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { name, detailed } = listTablesInput.parse(args)
                const trimmedName = name?.trim()
                const result = await tableService.list({
                    projectId: mcp.projectId,
                    cursor: undefined,
                    limit: FETCH_LIMIT,
                    name: trimmedName ? trimmedName : undefined,
                    externalIds: undefined,
                    folderId: undefined,
                    includeRowCount: true,
                })

                if (result.data.length === 0) {
                    const emptyText = trimmedName ? `No tables matching "${trimmedName}".` : 'No tables found in this project.'
                    return {
                        content: [{ type: 'text', text: emptyText }],
                        structuredContent: { tables: [], count: 0 },
                    }
                }

                const shown = result.data.slice(0, DISPLAY_CAP)
                const fieldsByTable = await fieldService.getAllByTableIds({
                    projectId: mcp.projectId,
                    tableIds: shown.map(t => t.id),
                })

                const tables = shown.map((table) => ({ table, fields: fieldsByTable.get(table.id) ?? [], rowCount: table.rowCount ?? 0 }))
                const lines = tables.map(({ table, fields, rowCount }) => detailed
                    ? `- ${table.name} (id: ${table.id}, externalId: ${table.externalId}) — ${rowCount} records\n  Fields:\n${fields.map(f => `    - ${formatFieldInfo(f)} externalId: ${f.externalId}`).join('\n')}`
                    : `- ${table.name} (id: ${table.id}, externalId: ${table.externalId}, ${rowCount} rows): ${fields.map(f => `${f.name}:${f.type}`).join(', ')}`)

                const hidden = result.data.length - shown.length
                const moreLabel = isNil(result.next) ? `${hidden}` : `${hidden}+`
                const truncationNote = hidden > 0
                    ? `\n\n⚠️ ${moreLabel} more table(s) not shown. Narrow with name.`
                    : ''
                const idHint = '\n\nℹ️ Use "id" with the record/field tools; use "externalId" as table_id when configuring a Tables piece step in a flow.'
                return {
                    content: [{ type: 'text', text: lines.join(detailed ? '\n\n' : '\n') + truncationNote + idHint }],
                    structuredContent: {
                        tables: tables.map(({ table, fields, rowCount }) => ({
                            id: table.id,
                            externalId: table.externalId,
                            name: table.name,
                            rowCount,
                            fields: fields.map(f => detailed
                                ? { id: f.id, externalId: f.externalId, name: f.name, type: f.type }
                                : { name: f.name, type: f.type }),
                        })),
                        count: tables.length,
                        hidden,
                    },
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_list_tables failed')
                return mcpUtils.mcpToolError('Failed to list tables', err)
            }
        },
    }
}
