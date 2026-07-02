import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveInternalTableId, tableNotFoundError } from './table-utils'

const clearTableInput = z.object({
    tableId: z.string().describe('The table ID to empty (the "id" from ap_list_tables; the externalId is also accepted). Pass it so the open Stage shows the rows clear live.'),
    displayName: z.string().optional().describe('Short approval prompt shown to the user (e.g. "Clear all rows from Emails table"). Must include what the action does and the target name.'),
})

export const apClearTableTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_clear_table',
        permission: Permission.WRITE_TABLE,
        description: 'Delete EVERY row in a table in one fast operation, keeping the table and its fields. Use this for "clear the table" / "empty it" / "delete all rows" / "reset the data" — never page through ap_find_records and ap_delete_records to empty a table. To delete a subset, use ap_delete_records (by id or filters) instead.',
        inputSchema: clearTableInput.shape,
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId } = clearTableInput.parse(args)

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const cleared = await recordService.deleteAll({
                    tableId: resolvedTableId,
                    projectId: mcp.projectId,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Cleared ${cleared.length} record(s). The table is now empty.`,
                    }],
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_clear_table failed')
                return mcpUtils.mcpToolError('Failed to clear table', err)
            }
        },
    }
}
