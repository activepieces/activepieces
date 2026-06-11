import { McpToolDefinition, Permission, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { getTableByAnyId, resolveFieldNamesForTable } from './table-utils'

const insertRecordsInput = z.object({
    tableId: z.string().describe('The table ID (internal id or externalId — both accepted). Use ap_list_tables to find it.'),
    records: z.array(z.record(z.string(), z.string())).min(1).max(50).describe('Array of records (1–50). Each record maps field names to values. Example: [{"Name": "Alice", "Age": "30"}]'),
})

export const apInsertRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_insert_records',
        permission: Permission.WRITE_TABLE,
        description: 'Insert one or more records into a table. Max 50 records per call.',
        inputSchema: insertRecordsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, records } = insertRecordsInput.parse(args)
                const table = await getTableByAnyId({ projectId: mcp.projectId, tableId })

                const allFieldNames = [...new Set(records.flatMap(r => Object.keys(r)))]
                const { fields, fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, table.id, allFieldNames)
                if (errors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Field resolution error:\n${errors.join('\n')}` }] }
                }

                const convertedRecords = records.map(record =>
                    Object.entries(record).map(([fieldName, value]) => ({
                        fieldId: fieldMap.get(fieldName)!,
                        value,
                    })),
                )

                const result = await recordService.create({
                    request: { tableId: table.id, records: convertedRecords },
                    projectId: mcp.projectId,
                    logger: log,
                    fields,
                })

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Inserted ${result.length} record(s). IDs: ${result.map(r => r.id).join(', ')}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_insert_records failed')
                return mcpUtils.mcpToolError('Failed to insert records', err)
            }
        },
    }
}
