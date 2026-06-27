import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveFieldNamesForTable, resolveInternalTableId, tableNotFoundError } from './table-utils'

const insertRecordsInput = z.object({
    tableId: z.string().describe('The table ID (the "id" from ap_list_tables; the externalId is also accepted)'),
    records: z.array(z.record(z.string(), z.string())).min(1).max(50).describe('Array of records (1–50). Each record maps field names to values. Example: [{"Name": "Alice", "Age": "30"}]'),
})

export const apInsertRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_insert_records',
        permission: Permission.WRITE_TABLE,
        description: 'Bulk-insert rows into an Activepieces Table — pass an array of records (1–50 per call; call again for the next batch). For many rows, insert in modest waves (~10 per call) so they stream into the open table as visible bursts instead of one delayed dump. This is the ONLY way to add table rows: never use ap_run_code or fetch() to write a table.',
        inputSchema: insertRecordsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, records } = insertRecordsInput.parse(args)

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const allFieldNames = [...new Set(records.flatMap(r => Object.keys(r)))]
                const { fields, fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, resolvedTableId, allFieldNames)
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
                    request: { tableId: resolvedTableId, records: convertedRecords },
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
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_insert_records failed')
                return mcpUtils.mcpToolError('Failed to insert records', err)
            }
        },
    }
}
