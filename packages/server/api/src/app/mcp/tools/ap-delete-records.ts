import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'

const deleteRecordsInput = z.object({
    recordIds: z.array(z.string()).describe('Array of record IDs to delete. Use ap_find_records to find them.'),
})

export const apDeleteRecordsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_records',
        permission: Permission.WRITE_TABLE,
        description: 'Permanently delete one or more records from a table by their IDs. This action cannot be undone. Use ap_find_records to get record IDs.',
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
                log.error({ err, projectId: mcp.projectId }, 'ap_delete_records failed')
                return mcpUtils.mcpToolError('Failed to delete records', err)
            }
        },
    }
}
