import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { mcpToolError } from './mcp-utils'
import { formatFieldInfo } from './table-utils'

export const apListTablesTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_tables',
        permission: Permission.READ_TABLE,
        description: 'List all tables in the current project with their fields (name, type, id) and row counts. Use this to discover available tables before querying or modifying data. Returns table IDs needed by other table tools.',
        inputSchema: {},
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async () => {
            try {
                const result = await tableService.list({
                    projectId: mcp.projectId,
                    cursor: undefined,
                    limit: 100,
                    name: undefined,
                    externalIds: undefined,
                    folderId: undefined,
                    includeRowCount: true,
                })

                if (result.data.length === 0) {
                    return { content: [{ type: 'text', text: 'No tables found in this project.' }] }
                }

                const tableIds = result.data.map(t => t.id)
                const fieldsByTable = await fieldService.getAllByTableIds({
                    projectId: mcp.projectId,
                    tableIds,
                })

                const tableDetails = result.data.map((table) => {
                    const fields = fieldsByTable.get(table.id) ?? []
                    const rowCount = table.rowCount ?? 0
                    const fieldLines = fields.map(f => `    - ${formatFieldInfo(f)}`).join('\n')
                    return `- ${table.name} (id: ${table.id}) — ${rowCount} records\n  Fields:\n${fieldLines}`
                })

                const output = tableDetails.join('\n\n')
                const truncationNote = result.data.length >= 100
                    ? '\n\n⚠️ Showing first 100 tables. There may be more in this project.'
                    : ''
                return {
                    content: [{
                        type: 'text',
                        text: output + truncationNote,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_list_tables failed')
                return mcpToolError('Failed to list tables', err)
            }
        },
    }
}
