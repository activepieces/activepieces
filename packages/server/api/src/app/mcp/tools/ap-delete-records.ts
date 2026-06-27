import { Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'

const deleteRecordsInput = z.object({
    tableId: z.string().optional().describe('The table ID the records belong to (the "id" from ap_list_tables/ap_find_records). Pass it so the open Stage shows live deletions.'),
    recordIds: z.array(z.string()).describe('Array of record IDs to delete. Use ap_find_records to find them.'),
    displayName: z.string().optional().describe('Short approval prompt shown to the user (e.g. "Delete 3 records from Emails table"). Must include what the action does and the target name.'),
})

export const apDeleteRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_records',
        permission: Permission.WRITE_TABLE,
        description: 'Permanently delete records by id — pass the FULL array of record ids in ONE call (no cap; ap_find_records returns them). This is the ONLY way to delete table rows: never script deletion with ap_run_code or fetch().',
        inputSchema: deleteRecordsInput.shape,
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { recordIds } = deleteRecordsInput.parse(args)

                if (recordIds.length === 0) {
                    return { content: [{ type: 'text', text: '❌ No record IDs provided.' }] }
                }

                const deleted = await recordService.delete({
                    ids: recordIds,
                    projectId: mcp.projectId,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Deleted ${deleted.length} record(s).`,
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
