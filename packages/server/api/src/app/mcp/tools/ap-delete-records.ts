import { Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'

const deleteRecordsInput = z.object({
    tableId: z.string().describe('ID of the table the records belong to. Use ap_find_records to find it.'),
    recordIds: z.array(z.string()).describe('Array of record IDs to delete. Use ap_find_records to find them.'),
    displayName: z.string().optional().describe('Short approval prompt shown to the user (e.g. "Delete 3 records from Emails table"). Must include what the action does and the target name.'),
})

export const apDeleteRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_records',
        permission: Permission.WRITE_TABLE,
        description: 'Permanently delete one or more records by their IDs.',
        inputSchema: deleteRecordsInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordIds } = deleteRecordsInput.parse(args)

                if (recordIds.length === 0) {
                    return { content: [{ type: 'text', text: '❌ No record IDs provided.' }] }
                }

                const { deletedCount } = await recordService.delete({
                    ids: recordIds,
                    projectId: mcp.projectId,
                    tableId,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Deleted ${deletedCount} record(s).`,
                    }],
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_delete_records failed')
                return mcpUtils.mcpToolError('Failed to delete records', err)
            }
        },
    }
}
