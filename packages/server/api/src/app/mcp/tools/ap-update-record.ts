import { isNil, McpToolDefinition, Permission, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { formatPopulatedRecord, resolveFieldNamesForTable, resolveInternalTableId, tableNotFoundError } from './table-utils'

const updateRecordInput = z.object({
    tableId: z.string().describe('The table ID'),
    recordId: z.string().describe('The record ID to update. Use ap_find_records to find it.'),
    fields: z.record(z.string(), z.string()).describe('Object mapping field names to new values. Only specified fields are updated. Example: {"Name": "Bob", "Age": "25"}'),
})

export const apUpdateRecordTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_update_record',
        permission: Permission.WRITE_TABLE,
        description: 'Update specific cells in a record. Only specified fields are changed.',
        inputSchema: updateRecordInput.shape,
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordId, fields: fieldValues } = updateRecordInput.parse(args)

                const fieldNames = Object.keys(fieldValues)
                if (fieldNames.length === 0) {
                    return { content: [{ type: 'text', text: '❌ No fields provided to update.' }] }
                }

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const { fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, resolvedTableId, fieldNames)
                if (errors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Field resolution error:\n${errors.join('\n')}` }] }
                }

                const cells = Object.entries(fieldValues).map(([fieldName, value]) => ({
                    fieldId: fieldMap.get(fieldName)!,
                    value,
                }))

                const updated = await recordService.update({
                    id: recordId,
                    projectId: mcp.projectId,
                    request: { tableId: resolvedTableId, cells },
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Record updated:\n${formatPopulatedRecord(updated)}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_update_record failed')
                return mcpUtils.mcpToolError('Failed to update record', err)
            }
        },
    }
}
