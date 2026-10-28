import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { tableToolInput } from './table-tool-input'
import { resolveInternalTableId, tableNotFoundError } from './table-utils'

const insertRecordsInput = z.object({
    tableId: z.string().describe('The table ID (the "id" from ap_list_tables; the externalId is also accepted)'),
    records: z.array(z.record(z.string(), tableToolInput.cellInputValueSchema)).min(1).max(50).describe('Records (1–50). Keys are field names (case-insensitive) or field ids/externalIds. Example: [{"Name": "Alice", "Age": 30}]'),
})

export const apInsertRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_insert_records',
        permission: Permission.WRITE_TABLE,
        description: 'Insert records into a table (max 50 per call). Key each record by field name (case-insensitive) or field id/externalId.',
        inputSchema: insertRecordsInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, records } = insertRecordsInput.parse(args)

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const fields = await fieldService.getAll({ projectId: mcp.projectId, tableId: resolvedTableId })
                const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))]
                const { fieldMap, errors } = tableToolInput.resolveFieldKeys({ fields, keys: allKeys })
                if (errors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Field resolution error:\n${errors.join('\n')}` }] }
                }

                const convertedRecords = records.map(record =>
                    Object.entries(record).flatMap(([key, rawValue]) => {
                        const field = fieldMap.get(key)
                        const value = tableToolInput.stringifyCellValue(rawValue)
                        return isNil(field) || isNil(value) ? [] : [{ fieldId: field.id, value }]
                    }),
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
