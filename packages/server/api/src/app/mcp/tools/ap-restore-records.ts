import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveInternalTableId, tableNotFoundError } from './table-utils'

const restoreRecordsInput = z.object({
    tableId: z.string().describe('The table ID the records belong to (the "id" from ap_list_tables/ap_find_records). Pass it so the open Stage shows the rows reappear.'),
    recordIds: z.array(z.string()).describe('Array of record IDs to restore — the ids returned by the ap_delete_records call you want to undo.'),
    displayName: z.string().optional().describe('Short label shown to the user (e.g. "Restore 4 rows to Competitor Intelligence").'),
})

export const apRestoreRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_restore_records',
        permission: Permission.WRITE_TABLE,
        description: 'Undo a delete — restore rows previously deleted with ap_delete_records, by id. The ids come from the ✅ result of the ap_delete_records call you want to reverse. Restored rows reappear in the open Stage with their original data intact.',
        inputSchema: restoreRecordsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordIds } = restoreRecordsInput.parse(args)

                if (recordIds.length === 0) {
                    return { content: [{ type: 'text', text: '❌ Provide recordIds to restore.' }] }
                }

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const restored = await recordService.restore({
                    ids: recordIds,
                    projectId: mcp.projectId,
                    tableId: resolvedTableId,
                })

                return { content: [{ type: 'text', text: `✅ Restored ${restored.length} record(s).` }] }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_restore_records failed')
                return mcpUtils.mcpToolError('Failed to restore records', err)
            }
        },
    }
}
