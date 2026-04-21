import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { tableService } from '../../tables/table/table.service'
import { mcpUtils } from './mcp-utils'

const deleteTableInput = z.object({
    tableId: z.string().describe('The ID of the table to delete. Use ap_list_tables to find it.'),
})

export const apDeleteTableTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_table',
        permission: Permission.WRITE_TABLE,
        description: 'Permanently delete a table and all its data.',
        inputSchema: deleteTableInput.shape,
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId } = deleteTableInput.parse(args)

                const table = await tableService.getOneOrThrow({
                    projectId: mcp.projectId,
                    id: tableId,
                })

                await tableService.delete({
                    projectId: mcp.projectId,
                    id: tableId,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Table "${table.name}" deleted successfully.`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_delete_table failed')
                return mcpUtils.mcpToolError('Failed to delete table', err)
            }
        },
    }
}
